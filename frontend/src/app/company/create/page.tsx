'use client';

/**
 * Create a company page.
 *
 * The person who creates a company becomes its owner, which is the only way a
 * company membership comes into existence without an invitation. It is created
 * unverified: nothing on this form grants a badge, and the copy says so rather
 * than leaving the impression that filling in a legal name is verification.
 */
import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';

import GlassPanel from '../../../components/company/GlassPanel';
import { useCreateCompany } from '../../../features/company/hooks';
import { companyCreateSchema, CompanyCreateForm } from '../../../features/company/schemas';
import {
  COMPANY_INDUSTRIES,
  COMPANY_SIZES,
  COMPANY_TYPES,
} from '../../../features/company/constants';
import { CompanyCreatePayload } from '../../../features/company/types';
import useAuth from '../../../hooks/useAuth';

/** "Kirmya Labs, Inc." becomes "kirmya-labs-inc". */
const toSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);

export default function CreateCompanyPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const create = useCreateCompany();

  // Once the slug has been typed in by hand it stops tracking the name, so a
  // deliberate address is never overwritten by a later edit to the name.
  const [slugTouched, setSlugTouched] = React.useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyCreateForm>({
    resolver: zodResolver(companyCreateSchema),
    defaultValues: {
      name: '',
      slug: '',
      tagline: '',
      description: '',
      industry: '',
      companyType: '',
      companySize: '',
      foundedYear: '',
      headquarters: '',
      website: '',
      contactEmail: '',
    },
  });

  const slug = watch('slug');

  const onSubmit = handleSubmit((values) => {
    const payload: CompanyCreatePayload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      industry: values.industry.trim(),
    };
    if (values.tagline) payload.tagline = values.tagline.trim();
    if (values.description) payload.description = values.description.trim();
    if (values.companyType) payload.companyType = values.companyType;
    if (values.companySize) payload.companySize = values.companySize;
    if (values.headquarters) payload.headquarters = values.headquarters.trim();
    if (values.website) payload.website = values.website.trim();
    if (values.contactEmail) payload.contactEmail = values.contactEmail.trim();
    if (typeof values.foundedYear === 'number') payload.foundedYear = values.foundedYear;

    create.mutate(payload, {
      onSuccess: (company) => {
        router.push(`/company/dashboard?company=${encodeURIComponent(company.slug)}`);
      },
    });
  });

  if (!authLoading && !isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="info" sx={{ borderRadius: '16px' }}>
          <AlertTitle>Sign in to create a company</AlertTitle>
          A company page belongs to the account that creates it, so you need to be signed in.
          <Box sx={{ mt: 2 }}>
            <Button
              component={NextLink}
              href={`/signin?redirect=${encodeURIComponent('/company/create')}`}
              variant="contained"
              size="small"
            >
              Sign in
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
        Create a company page
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        You will be the owner of this page and can add colleagues afterwards.
      </Typography>

      {create.isError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>
          {(create.error as Error).message}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={3}>
          <GlassPanel title="Identity" description="How the company is named and addressed.">
            <Stack spacing={2.5}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Company name"
                    required
                    fullWidth
                    autoFocus
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    onChange={(event) => {
                      field.onChange(event);
                      if (!slugTouched) {
                        setValue('slug', toSlug(event.target.value), { shouldValidate: true });
                      }
                    }}
                  />
                )}
              />

              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Public address"
                    required
                    fullWidth
                    error={!!errors.slug}
                    helperText={
                      errors.slug?.message ||
                      'This becomes the company’s permanent address and cannot be changed later.'
                    }
                    onChange={(event) => {
                      setSlugTouched(true);
                      field.onChange(event.target.value.toLowerCase());
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">kirmya.com/company/</InputAdornment>
                      ),
                    }}
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
                    error={!!errors.tagline}
                    helperText={errors.tagline?.message || 'One line, shown under the name.'}
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
                    minRows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Stack>
          </GlassPanel>

          <GlassPanel title="Classification" description="Used to place the company in search.">
            <Stack spacing={2.5}>
              <Controller
                name="industry"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    freeSolo
                    options={COMPANY_INDUSTRIES}
                    value={field.value || ''}
                    onChange={(_, value) => field.onChange(value ?? '')}
                    onInputChange={(_, value) => field.onChange(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Industry"
                        required
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
                    <TextField {...field} select label="Company type" fullWidth>
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
                    <TextField {...field} select label="Company size" fullWidth>
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
                      placeholder="City, Country"
                      error={!!errors.headquarters}
                      helperText={errors.headquarters?.message}
                    />
                  )}
                />
              </Stack>
            </Stack>
          </GlassPanel>

          <GlassPanel title="Contact" description="Shown publicly on the company page.">
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="website"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Website"
                    fullWidth
                    placeholder="https://example.com"
                    error={!!errors.website}
                    helperText={errors.website?.message}
                  />
                )}
              />
              <Controller
                name="contactEmail"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact email"
                    fullWidth
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail?.message}
                  />
                )}
              />
            </Stack>
          </GlassPanel>

          <Alert severity="info" sx={{ borderRadius: '16px' }}>
            <AlertTitle>The page starts unverified</AlertTitle>
            Creating a page does not make a company verified. A Kirmya administrator reviews
            verification separately, and only their approval shows the badge.
          </Alert>

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button component={NextLink} href="/company" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<AddBusinessOutlinedIcon />}
              disabled={isSubmitting || create.isPending || !slug}
              sx={{ textTransform: 'none' }}
            >
              {create.isPending ? 'Creating…' : 'Create company page'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
