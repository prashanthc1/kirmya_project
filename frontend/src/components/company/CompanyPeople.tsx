'use client';

/**
 * The public "People" directory for a company.
 *
 * Only associations the person has marked public reach this endpoint for a
 * non-member caller, and email is omitted unless the caller holds `team:view`.
 * Nothing here reconstructs a hidden association from another field, and the
 * component renders exactly the people the server returned.
 */
import React from 'react';
import NextLink from 'next/link';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HowToRegIcon from '@mui/icons-material/HowToReg';

import { useDepartments, usePeople } from '../../features/company/hooks';
import {
  ASSOCIATION_LABELS,
  AssociationType,
  CompanyPerson,
  PeopleQuery,
} from '../../features/company/types';
import { AutoGrid } from './CompanyBadges';
import RequestAssociationDialog from './RequestAssociationDialog';

interface CompanyPeopleProps {
  identifier: string;
  companyId: string;
  companyName: string;
  isAuthenticated: boolean;
  /** Members already have an association, so they are not offered the form. */
  isMember?: boolean;
  onRequireSignIn?: () => void;
  pageSize?: number;
}

const useDebounced = <T,>(value: T, delay = 350): T => {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export const PersonCard: React.FC<{ person: CompanyPerson }> = ({ person }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '16px',
        height: '100%',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar src={person.photoUrl || undefined} alt="" sx={{ width: 56, height: 56 }}>
          {person.name?.charAt(0) ?? '?'}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            component={person.userId ? NextLink : 'span'}
            {...(person.userId ? { href: `/profile/${person.userId}` } : {})}
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              textDecoration: 'none',
              display: 'block',
              '&:hover': { color: person.userId ? 'primary.main' : 'text.primary' },
            }}
          >
            {person.name}
          </Typography>
          {person.jobTitle && (
            <Typography variant="body2" color="text.secondary">
              {person.jobTitle}
            </Typography>
          )}
          {person.department && (
            <Typography variant="caption" color="text.secondary">
              {person.department}
            </Typography>
          )}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            <Chip
              size="small"
              variant="outlined"
              label={ASSOCIATION_LABELS[person.associationType as AssociationType] ?? person.associationType}
            />
            {person.location && <Chip size="small" variant="outlined" label={person.location} />}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export const CompanyPeople: React.FC<CompanyPeopleProps> = ({
  identifier,
  companyId,
  companyName,
  isAuthenticated,
  isMember = false,
  onRequireSignIn,
  pageSize = 12,
}) => {
  const [search, setSearch] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [associationType, setAssociationType] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [associationOpen, setAssociationOpen] = React.useState(false);

  const debouncedSearch = useDebounced(search);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentId, associationType]);

  const query: PeopleQuery = React.useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(debouncedSearch ? { query: debouncedSearch } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(associationType ? { associationType } : {}),
    }),
    [page, pageSize, debouncedSearch, departmentId, associationType]
  );

  const { data, isLoading, isFetching, isError, error } = usePeople(identifier, query, {
    placeholderData: (previous) => previous,
  });
  const { data: departments } = useDepartments(identifier);

  const handleRequestClick = () => {
    if (!isAuthenticated) {
      onRequireSignIn?.();
      return;
    }
    setAssociationOpen(true);
  };

  const people = data?.items ?? [];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ mb: 3 }}
      >
        <TextField
          size="small"
          label="Search people"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
          sx={{ flexGrow: 1 }}
        />
        {!!departments?.length && (
          <TextField
            select
            size="small"
            label="Department"
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All departments</MenuItem>
            {departments.map((department) => (
              <MenuItem key={department.id} value={department.id}>
                {department.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          select
          size="small"
          label="Association"
          value={associationType}
          onChange={(event) => setAssociationType(event.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Everyone</MenuItem>
          {(Object.keys(ASSOCIATION_LABELS) as AssociationType[]).map((type) => (
            <MenuItem key={type} value={type}>
              {ASSOCIATION_LABELS[type]}
            </MenuItem>
          ))}
        </TextField>
        {!isMember && (
          <Button variant="outlined" startIcon={<HowToRegIcon />} onClick={handleRequestClick}>
            I work here
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'person' : 'people'} listed publicly
        </Typography>
        {isFetching && !isLoading && <CircularProgress size={14} />}
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.message || 'People could not be loaded.'}
        </Alert>
      )}

      {isLoading ? (
        <AutoGrid min={260}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={140} sx={{ borderRadius: '16px' }} />
          ))}
        </AutoGrid>
      ) : people.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Nobody has publicly listed themselves at {companyName} yet.
        </Typography>
      ) : (
        <AutoGrid min={260}>
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </AutoGrid>
      )}

      {(data?.totalPages ?? 0) > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={data?.totalPages ?? 1}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}

      <RequestAssociationDialog
        open={associationOpen}
        onClose={() => setAssociationOpen(false)}
        companyId={companyId}
        companyName={companyName}
        departments={departments ?? []}
      />
    </Box>
  );
};

export default CompanyPeople;
