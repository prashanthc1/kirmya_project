'use client';

/**
 * Logo, cover, social links and downloadable brand assets.
 *
 * Kirmya stores links, not bytes, so everything here is a URL and is checked
 * against the same rule the server applies before it is saved. The preview is
 * the real image at the real address: if it does not load here it will not load
 * on the public page either, which is the point of showing it.
 */
import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { useUpdateCompany } from '../../features/company/hooks';
import { validateImageUrl } from '../../features/company/schemas';
import { BrandAsset, CompanyDetail } from '../../features/company/types';
import GlassPanel from './GlassPanel';

/** The networks Kirmya renders an icon and label for on the public page. */
const SOCIAL_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'github', label: 'GitHub' },
];

const isHttpUrl = (value: string) => /^https?:\/\/.+/i.test(value.trim());

interface CompanyBrandingProps {
  company: CompanyDetail;
  canEdit: boolean;
}

export const CompanyBranding: React.FC<CompanyBrandingProps> = ({ company, canEdit }) => {
  const save = useUpdateCompany(company.id);

  const [logoUrl, setLogoUrl] = React.useState(company.logoUrl ?? '');
  const [coverUrl, setCoverUrl] = React.useState(company.coverUrl ?? '');
  const [social, setSocial] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    SOCIAL_FIELDS.forEach(({ key }) => {
      initial[key] = company.socialLinks?.[key] ?? '';
    });
    return initial;
  });
  const [assets, setAssets] = React.useState<BrandAsset[]>(company.brandAssets ?? []);
  const [saved, setSaved] = React.useState(false);

  const logoError = logoUrl.trim() ? validateImageUrl(logoUrl).error : undefined;
  const coverError = coverUrl.trim() ? validateImageUrl(coverUrl).error : undefined;

  const assetErrors = assets.map((asset) => {
    if (!asset.url.trim() && !asset.label.trim()) return undefined;
    if (!asset.label.trim()) return 'Name this asset';
    return isHttpUrl(asset.url) ? undefined : 'Links must start with http:// or https://';
  });

  const socialErrors = React.useMemo(() => {
    const errors: Record<string, string> = {};
    Object.entries(social).forEach(([key, value]) => {
      if (value.trim() && !isHttpUrl(value)) {
        errors[key] = 'Links must start with http:// or https://';
      }
    });
    return errors;
  }, [social]);

  const blocked =
    !!logoError ||
    !!coverError ||
    Object.keys(socialErrors).length > 0 ||
    assetErrors.some(Boolean);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (blocked) return;
    save.mutate(
      {
        logoUrl: logoUrl.trim(),
        coverUrl: coverUrl.trim(),
        // Empty fields are sent as empty strings so clearing a link clears it,
        // rather than leaving the previous value in place.
        socialLinks: Object.fromEntries(
          Object.entries(social).map(([key, value]) => [key, value.trim()])
        ),
        brandAssets: assets
          .filter((asset) => asset.label.trim() && asset.url.trim())
          .map((asset) => ({
            label: asset.label.trim(),
            url: asset.url.trim(),
            mimeType: asset.mimeType.trim(),
          })),
      },
      { onSuccess: () => setSaved(true) }
    );
  };

  return (
    <Box component="form" onSubmit={submit}>
      <Stack spacing={3}>
        {!canEdit && (
          <Alert severity="info" sx={{ borderRadius: '16px' }}>
            You can see this company&apos;s branding but not change it. That needs the branding
            permission.
          </Alert>
        )}
        {save.error && (
          <Alert severity="error" sx={{ borderRadius: '16px' }}>
            {(save.error as Error).message}
          </Alert>
        )}

        <GlassPanel
          title="Logo and cover"
          description="Paste the address of an image you already host. Kirmya stores the link."
        >
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <Avatar
                src={logoError ? undefined : logoUrl || undefined}
                variant="rounded"
                sx={{ width: 72, height: 72, fontSize: 28 }}
              >
                {company.name?.charAt(0)}
              </Avatar>
              <TextField
                fullWidth
                label="Logo URL"
                value={logoUrl}
                disabled={!canEdit}
                onChange={(event) => setLogoUrl(event.target.value)}
                error={!!logoError}
                helperText={logoError ?? 'Square works best. PNG, JPEG, WebP, GIF or SVG.'}
              />
            </Stack>

            <div>
              <TextField
                fullWidth
                label="Cover image URL"
                value={coverUrl}
                disabled={!canEdit}
                onChange={(event) => setCoverUrl(event.target.value)}
                error={!!coverError}
                helperText={coverError ?? 'Shown as a banner across the top of the company page.'}
              />
              {!coverError && coverUrl.trim() && (
                <Box
                  component="img"
                  src={coverUrl}
                  alt=""
                  sx={{
                    mt: 2,
                    width: '100%',
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: '16px',
                    display: 'block',
                  }}
                />
              )}
            </div>
          </Stack>
        </GlassPanel>

        <GlassPanel
          title="Social links"
          description="Only the networks you fill in are shown on the public page."
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            {SOCIAL_FIELDS.map(({ key, label }) => (
              <TextField
                key={key}
                label={label}
                value={social[key] ?? ''}
                disabled={!canEdit}
                onChange={(event) =>
                  setSocial((previous) => ({ ...previous, [key]: event.target.value }))
                }
                error={!!socialErrors[key]}
                helperText={socialErrors[key]}
                InputProps={
                  isHttpUrl(social[key] ?? '')
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              component="a"
                              href={social[key]}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${label} in a new tab`}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    : undefined
                }
              />
            ))}
          </Box>
        </GlassPanel>

        <GlassPanel
          title="Brand assets"
          description="Press kits, logo packs and guidelines, offered as downloads on the About page."
        >
          <Stack spacing={2}>
            {assets.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No brand assets have been added.
              </Typography>
            )}

            {assets.map((asset, index) => (
              <Stack
                key={index}
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                alignItems={{ md: 'flex-start' }}
              >
                <TextField
                  label="Name"
                  value={asset.label}
                  disabled={!canEdit}
                  sx={{ minWidth: 180 }}
                  onChange={(event) =>
                    setAssets((previous) =>
                      previous.map((entry, i) =>
                        i === index ? { ...entry, label: event.target.value } : entry
                      )
                    )
                  }
                />
                <TextField
                  label="URL"
                  value={asset.url}
                  disabled={!canEdit}
                  fullWidth
                  error={!!assetErrors[index]}
                  helperText={assetErrors[index]}
                  onChange={(event) =>
                    setAssets((previous) =>
                      previous.map((entry, i) =>
                        i === index ? { ...entry, url: event.target.value } : entry
                      )
                    )
                  }
                />
                <TextField
                  label="File type"
                  value={asset.mimeType}
                  disabled={!canEdit}
                  placeholder="application/pdf"
                  sx={{ minWidth: 170 }}
                  onChange={(event) =>
                    setAssets((previous) =>
                      previous.map((entry, i) =>
                        i === index ? { ...entry, mimeType: event.target.value } : entry
                      )
                    )
                  }
                />
                {canEdit && (
                  <IconButton
                    aria-label={`Remove ${asset.label || 'asset'}`}
                    onClick={() =>
                      setAssets((previous) => previous.filter((_, i) => i !== index))
                    }
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                )}
              </Stack>
            ))}

            {canEdit && (
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  setAssets((previous) => [...previous, { label: '', url: '', mimeType: '' }])
                }
                sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
              >
                Add an asset
              </Button>
            )}
          </Stack>
        </GlassPanel>

        {canEdit && (
          <Button
            type="submit"
            variant="contained"
            disabled={save.isPending || blocked}
            sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
          >
            {save.isPending ? 'Saving…' : 'Save branding'}
          </Button>
        )}
      </Stack>

      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        message="Branding saved."
      />
    </Box>
  );
};

export default CompanyBranding;
