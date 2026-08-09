'use client';

/**
 * Company search for the public directory.
 *
 * Filters are held in component state and sent to the server, which does the
 * matching — nothing is filtered client-side, so what the user sees is what the
 * query actually returned.
 */
import React from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import { useCompanySearch } from '../../features/company/hooks';
import { CompanySearchQuery } from '../../features/company/types';
import {
  COMPANY_INDUSTRIES,
  COMPANY_SIZES,
  COMPANY_SORTS,
  COMPANY_TYPES,
} from '../../features/company/constants';
import { AutoGrid } from './CompanyBadges';
import CompanySummaryCard from './CompanySummaryCard';

interface CompanySearchProps {
  initialQuery?: string;
  pageSize?: number;
}

const emptyFilters = {
  query: '',
  industry: '',
  location: '',
  size: '',
  type: '',
  hiring: false,
  verified: false,
  sort: 'relevance',
};

type Filters = typeof emptyFilters;

export const CompanySearch: React.FC<CompanySearchProps> = ({
  initialQuery = '',
  pageSize = 12,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // `draft` is what the user is typing; `applied` is what has been searched.
  const [draft, setDraft] = React.useState<Filters>({ ...emptyFilters, query: initialQuery });
  const [applied, setApplied] = React.useState<Filters>({ ...emptyFilters, query: initialQuery });
  const [page, setPage] = React.useState(1);

  const query: CompanySearchQuery = React.useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(applied.query ? { query: applied.query } : {}),
      ...(applied.industry ? { industry: applied.industry } : {}),
      ...(applied.location ? { location: applied.location } : {}),
      ...(applied.size ? { size: applied.size } : {}),
      ...(applied.type ? { type: applied.type } : {}),
      ...(applied.hiring ? { hiring: true } : {}),
      ...(applied.verified ? { verified: true } : {}),
      ...(applied.sort ? { sort: applied.sort } : {}),
    }),
    [applied, page, pageSize]
  );

  const { data, isLoading, isError, error } = useCompanySearch(query, {
    placeholderData: (previous) => previous,
  });

  const apply = (next: Filters) => {
    setDraft(next);
    setApplied(next);
    setPage(1);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    apply(draft);
  };

  const activeChips = (
    [
      applied.industry && { key: 'industry', label: applied.industry },
      applied.location && { key: 'location', label: applied.location },
      applied.size && { key: 'size', label: `${applied.size} employees` },
      applied.type && { key: 'type', label: applied.type },
      applied.hiring && { key: 'hiring', label: 'Actively hiring' },
      applied.verified && { key: 'verified', label: 'Verified only' },
    ].filter(Boolean) as Array<{ key: keyof Filters; label: string }>
  ).map((chip) => (
    <Chip
      key={chip.key}
      label={chip.label}
      size="small"
      onDelete={() =>
        apply({
          ...applied,
          [chip.key]: typeof applied[chip.key] === 'boolean' ? false : '',
        } as Filters)
      }
    />
  ));

  const companies = data?.items ?? [];

  return (
    <Box>
      <Box
        component="form"
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search companies"
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: '20px',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Company, keyword or industry"
            value={draft.query}
            onChange={(event) => setDraft({ ...draft, query: event.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Location"
            value={draft.location}
            onChange={(event) => setDraft({ ...draft, location: event.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" size="large" sx={{ minWidth: 140 }}>
            Search
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <Autocomplete
            freeSolo
            options={COMPANY_INDUSTRIES}
            value={draft.industry}
            onInputChange={(_, value) => setDraft({ ...draft, industry: value })}
            renderInput={(params) => <TextField {...params} size="small" label="Industry" />}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <TextField
            select
            size="small"
            label="Size"
            value={draft.size}
            onChange={(event) => setDraft({ ...draft, size: event.target.value })}
            sx={{ flex: 1, minWidth: 160 }}
          >
            <MenuItem value="">Any size</MenuItem>
            {COMPANY_SIZES.map((size) => (
              <MenuItem key={size} value={size}>
                {size} employees
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Type"
            value={draft.type}
            onChange={(event) => setDraft({ ...draft, type: event.target.value })}
            sx={{ flex: 1, minWidth: 160 }}
          >
            <MenuItem value="">Any type</MenuItem>
            {COMPANY_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Sort"
            value={draft.sort}
            onChange={(event) => apply({ ...draft, sort: event.target.value })}
            sx={{ flex: 1, minWidth: 160 }}
          >
            {COMPANY_SORTS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 1 }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={draft.hiring}
                onChange={(event) => apply({ ...draft, hiring: event.target.checked })}
              />
            }
            label={<Typography variant="body2">Actively hiring</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={draft.verified}
                onChange={(event) => apply({ ...draft, verified: event.target.checked })}
              />
            }
            label={<Typography variant="body2">Verified only</Typography>}
          />
          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={() => apply({ ...emptyFilters })}
          >
            Reset
          </Button>
        </Stack>
      </Box>

      {activeChips.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {activeChips}
        </Stack>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'company' : 'companies'}
      </Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.message || 'Search is unavailable right now.'}
        </Alert>
      )}

      {isLoading ? (
        <AutoGrid min={300}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={170} sx={{ borderRadius: '16px' }} />
          ))}
        </AutoGrid>
      ) : companies.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          No companies matched those filters.
        </Typography>
      ) : (
        <AutoGrid min={300}>
          {companies.map((company) => (
            <CompanySummaryCard key={company.id} company={company} />
          ))}
        </AutoGrid>
      )}

      {(data?.totalPages ?? 0) > 1 && (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Pagination
            count={data?.totalPages ?? 1}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
};

export default CompanySearch;
