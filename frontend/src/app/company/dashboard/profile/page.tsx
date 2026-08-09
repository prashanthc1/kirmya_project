'use client';

/**
 * Editing the company profile.
 *
 * This is the company's own record. It is deliberately separate from the
 * profiles of the people who work there: nothing typed here changes anyone's
 * personal profile, and nothing on a personal profile is copied into this one.
 *
 * The form saves only the fields it owns. `PATCH /companies/:id` leaves omitted
 * keys untouched, which is what lets the branding panel below save independently
 * without the two overwriting each other.
 */
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import CompanyDashboardShell from '../../../../components/company/CompanyDashboardShell';
import CompanyBranding from '../../../../components/company/CompanyBranding';
import GlassPanel from '../../../../components/company/GlassPanel';
import { useCompany, useUpdateCompany } from '../../../../features/company/hooks';
import {
  companyProfileSchema,
  CompanyProfileForm,
} from '../../../../features/company/schemas';
import {
  COMPANY_INDUSTRIES,
  COMPANY_SIZES,
  COMPANY_TYPES,
} from '../../../../features/company/constants';
import { CompanyDetail, CompanyUpdatePayload } from '../../../../features/company/types';

/** The free-text lists the About tab renders as chip blocks. */
const LIST_FIELDS = [
  { key: 'specialties', label: 'Specialties' },
  { key: 'values', label: 'Values' },
  { key: 'benefits', label: 'Benefits' },
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
  { key: 'technology', label: 'Technology' },
  { key: 'industries', label: 'Industries served' },
  { key: 'awards', label: 'Awards' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'operatingCountries', label: 'Operating countries' },
] as const;

type ListKey = (typeof LIST_FIELDS)[number]['key'];
type Lists = Record<ListKey, string[]>;

const listsOf = (company: CompanyDetail): Lists =>
  LIST_FIELDS.reduce((accumulator, field) => {
    accumulator[field.key] = company[field.key] ?? [];
    return accumulator;
  }, {} as Lists);

const sameList = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const ProfileForm: React.FC<{ company: CompanyDetail; canEdit: boolean }> = ({
  company,
  canEdit,
}) => {
  const save = useUpdateCompany(company.id);
  const [notice, setNotice] = React.useState('');
  const [lists, setLists] = React.useState<Lists>(() => listsOf(company));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyProfileForm>({
    resolver: zodResolver(companyProfileSchema),
    values: {
      name: company.name,
      tagline: company.tagline,
      description: company.description,
      industry: company.industry,
      companyType: company.companyType,
      companySize: company.companySize,
      foundedYear: company.foundedYear > 0 ? company.foundedYear : '',
      headquarters: company.headquarters,
      website: company.website,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      mission: company.mission,
      vision: company.vision,
      history: company.history,
      workCulture: company.workCulture,
      careerInfo: company.careerInfo,
    },
  });

  const listsDirty = LIST_FIELDS.some(
    (field) => !sameList(lists[field.key], company[field.key] ?? [])
  );

  const onSubmit = handleSubmit((values) => {
    const payload: CompanyUpdatePayload = {
      name: values.name.trim(),
      tagline: values.tagline.trim(),
      description: values.description.trim(),
      industry: values.industry.trim(),
      companyType: values.companyType.trim(),
      companySize: values.companySize.trim(),
      headquarters: values.headquarters.trim(),
      website: values.website.trim(),
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone.trim(),
      mission: values.mission.trim(),
      vision: values.vision.trim(),
      history: values.history.trim(),
      workCulture: values.workCulture.trim(),
      careerInfo: values.careerInfo.trim(),
      // Zero clears the year, which is how the server reads an absent founding date.
      foundedYear: typeof values.foundedYear === 'number' ? values.foundedYear : 0,
      ...lists,
    };

    save.mutate(payload, {
      onSuccess: (updated) => {
        reset(undefined, { keepValues: true });
        setLists(listsOf(updated));
        setNotice('Company profile saved.');
      },
    });
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Stack spacing={3}>
        {!canEdit && (
          <Alert severity="info" sx={{ borderRadius: '16px' }}>
            You can read the profile but not change it. Editing it needs the company:edit
            permission.
          </Alert>
        )}
        {save.isError && (
          <Alert severity="error" sx={{ borderRadius: '16px' }}>
            {(save.error as Error).message}
          </Alert>
        )}

        <GlassPanel
          title="Profile completeness"
          description="Counted from the fields that are filled in, not from an estimate."
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, company.profileCompletion))}
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 44 }}>
              {company.profileCompletion}%
            </Typography>
          </Stack>
        </GlassPanel>

        <GlassPanel title="Identity">
          <Stack spacing={2.5}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Company name"
                  fullWidth
                  disabled={!canEdit}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="tagline"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tagline"
                  fullWidth
                  disabled={!canEdit}
                  error={!!errors.tagline}
                  helperText={errors.tagline?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="About the company"
                  fullWidth
                  multiline
                  minRows={5}
                  disabled={!canEdit}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />
          </Stack>
        </GlassPanel>

        <GlassPanel title="Classification">
          <Stack spacing={2.5}>
            <Controller
              name="industry"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  freeSolo
                  disabled={!canEdit}
                  options={COMPANY_INDUSTRIES}
                  value={field.value || ''}
                  onChange={(_, value) => field.onChange(value ?? '')}
                  onInputChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Industry"
                      error={!!errors.industry}
                      helperText={errors.industry?.message}
                    />
                  )}
                />
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="companyType"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Company type" fullWidth disabled={!canEdit}>
                    <MenuItem value="">Not specified</MenuItem>
                    {COMPANY_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="companySize"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Company size" fullWidth disabled={!canEdit}>
                    <MenuItem value="">Not specified</MenuItem>
                    {COMPANY_SIZES.map((size) => (
                      <MenuItem key={size} value={size}>
                        {size} employees
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="foundedYear"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    type="number"
                    label="Founded"
                    fullWidth
                    disabled={!canEdit}
                    error={!!errors.foundedYear}
                    helperText={errors.foundedYear?.message}
                  />
                )}
              />
              <Controller
                name="headquarters"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Headquarters"
                    fullWidth
                    disabled={!canEdit}
                    error={!!errors.headquarters}
                    helperText={errors.headquarters?.message}
                  />
                )}
              />
            </Stack>
          </Stack>
        </GlassPanel>

        <GlassPanel
          title="Contact"
          description="Shown on the public page, so use an address the company is happy to publish."
        >
          <Stack spacing={2.5}>
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Website"
                  fullWidth
                  disabled={!canEdit}
                  error={!!errors.website}
                  helperText={errors.website?.message}
                />
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="contactEmail"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact email"
                    fullWidth
                    disabled={!canEdit}
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail?.message}
                  />
                )}
              />
              <Controller
                name="contactPhone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact phone"
                    fullWidth
                    disabled={!canEdit}
                    error={!!errors.contactPhone}
                    helperText={errors.contactPhone?.message}
                  />
                )}
              />
            </Stack>
          </Stack>
        </GlassPanel>

        <GlassPanel
          title="In your own words"
          description="Written by the company. Nothing here is generated or suggested."
        >
          <Stack spacing={2.5}>
            {(
              [
                { name: 'mission', label: 'Mission' },
                { name: 'vision', label: 'Vision' },
                { name: 'history', label: 'Our story' },
                { name: 'workCulture', label: 'Working here' },
                { name: 'careerInfo', label: 'Careers' },
              ] as const
            ).map((section) => (
              <Controller
                key={section.name}
                name={section.name}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={section.label}
                    fullWidth
                    multiline
                    minRows={3}
                    disabled={!canEdit}
                    error={!!errors[section.name]}
                    helperText={errors[section.name]?.message}
                  />
                )}
              />
            ))}
          </Stack>
        </GlassPanel>

        <GlassPanel
          title="Lists"
          description="Type a value and press Enter to add it. These appear as chips on the About tab."
        >
          <Stack spacing={2.5}>
            {LIST_FIELDS.map((field) => (
              <Autocomplete
                key={field.key}
                multiple
                freeSolo
                disabled={!canEdit}
                options={[] as string[]}
                value={lists[field.key]}
                onChange={(_, value) =>
                  setLists((previous) => ({
                    ...previous,
                    [field.key]: (value as string[])
                      .map((entry) => entry.trim())
                      .filter((entry, index, all) => entry && all.indexOf(entry) === index),
                  }))
                }
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return <Chip key={key} size="small" label={option} {...chipProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label={field.label} />}
              />
            ))}
          </Stack>
        </GlassPanel>

        {canEdit && (
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              type="button"
              disabled={save.isPending || (!isDirty && !listsDirty)}
              onClick={() => {
                reset();
                setLists(listsOf(company));
              }}
              sx={{ textTransform: 'none' }}
            >
              Discard changes
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={save.isPending || (!isDirty && !listsDirty)}
              sx={{ textTransform: 'none' }}
            >
              {save.isPending ? 'Saving…' : 'Save profile'}
            </Button>
          </Stack>
        )}

        <Snackbar
          open={!!notice}
          autoHideDuration={4000}
          onClose={() => setNotice('')}
          message={notice}
        />
      </Stack>
    </Box>
  );
};

const ProfilePanel: React.FC<{ slug: string; canEdit: boolean; canBrand: boolean }> = ({
  slug,
  canEdit,
  canBrand,
}) => {
  // The membership carries only the summary, and this screen edits fields that
  // live on the full record, so it is loaded here rather than passed down.
  const { data: company, isLoading, isError, error } = useCompany(slug);

  if (isLoading) {
    return (
      <Stack spacing={3}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={200} sx={{ borderRadius: '20px' }} />
        ))}
      </Stack>
    );
  }

  if (isError || !company) {
    return (
      <Alert severity="error" sx={{ borderRadius: '16px' }}>
        {error?.message || 'This company profile could not be loaded.'}
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <ProfileForm company={company} canEdit={canEdit} />
      <CompanyBranding company={company} canEdit={canBrand} />
    </Stack>
  );
};

export default function CompanyProfileSettingsPage() {
  return (
    <React.Suspense fallback={<Skeleton variant="rounded" height={520} sx={{ m: 4 }} />}>
      <CompanyDashboardShell
        title="Company profile"
        description="What visitors read on the public page."
        requires={['company:edit', 'branding:edit']}
      >
        {({ membership, can }) => (
          <ProfilePanel
            slug={membership.company.slug}
            canEdit={can('company:edit')}
            canBrand={can('branding:edit')}
          />
        )}
      </CompanyDashboardShell>
    </React.Suspense>
  );
}
