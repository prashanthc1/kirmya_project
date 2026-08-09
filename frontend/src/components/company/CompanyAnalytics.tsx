'use client';

/**
 * Company-wide analytics.
 *
 * The date range is sent to the server and the server aggregates; nothing is
 * recomputed here beyond formatting. Rates arrive as fractions and are shown as
 * percentages of the counts they were derived from, so a rate is always
 * traceable to two numbers on the same screen.
 */
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { useCompanyAnalytics } from '../../features/company/hooks';
import { AutoGrid, StatTile } from './CompanyBadges';
import GlassPanel from './GlassPanel';
import { BreakdownBars, FunnelBars, Series, TrendChart } from './charts';

const numberFormat = new Intl.NumberFormat();
const percent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

/** `YYYY-MM-DD` for a date N days before today, in the browser's timezone. */
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const PRESETS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct',
  search: 'Kirmya search',
  job_board: 'Job board',
  referral: 'Referral',
  company_page: 'Company page',
  recommendation: 'Recommendation',
  external: 'External link',
};

export const CompanyAnalytics: React.FC<{ companyId: string }> = ({ companyId }) => {
  const theme = useTheme();
  const [range, setRange] = React.useState({ from: daysAgo(30), to: daysAgo(0) });

  const { data, isLoading, isError, error, isFetching } = useCompanyAnalytics(companyId, range, {
    placeholderData: (previous) => previous,
  });

  const series: Series[] = React.useMemo(() => {
    const points = data?.series ?? [];
    return [
      {
        key: 'profileViews',
        label: 'Profile views',
        color: theme.palette.primary.main,
        values: points.map((point) => point.profileViews),
      },
      {
        key: 'jobViews',
        label: 'Job views',
        color: theme.palette.info.main,
        values: points.map((point) => point.jobViews),
      },
      {
        key: 'applications',
        label: 'Applications',
        color: theme.palette.success.main,
        values: points.map((point) => point.applications),
      },
      {
        key: 'followers',
        label: 'New followers',
        color: theme.palette.warning.main,
        values: points.map((point) => point.followers),
      },
    ];
  }, [data, theme]);

  return (
    <Stack spacing={3}>
      <GlassPanel>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <TextField
              type="date"
              size="small"
              label="From"
              value={range.from}
              onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: range.to }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              value={range.to}
              onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: range.from, max: daysAgo(0) }}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            {PRESETS.map((preset) => (
              <Button
                key={preset.days}
                size="small"
                variant={range.from === daysAgo(preset.days) ? 'contained' : 'outlined'}
                onClick={() => setRange({ from: daysAgo(preset.days), to: daysAgo(0) })}
                sx={{ textTransform: 'none' }}
              >
                {preset.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </GlassPanel>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {error?.message || 'Analytics could not be loaded.'}
        </Alert>
      )}

      {isLoading && !data ? (
        <>
          <AutoGrid min={200}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={116} sx={{ borderRadius: '16px' }} />
            ))}
          </AutoGrid>
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: '20px' }} />
        </>
      ) : data ? (
        <>
          <AutoGrid min={200}>
            <StatTile
              label="Profile views"
              value={numberFormat.format(data.profileViews)}
              icon={<VisibilityOutlinedIcon fontSize="small" color="primary" />}
            />
            <StatTile
              label="Unique visitors"
              value={numberFormat.format(data.uniqueVisitors)}
              icon={<PersonOutlineIcon fontSize="small" color="primary" />}
            />
            <StatTile
              label="Job views"
              value={numberFormat.format(data.jobViews)}
              icon={<WorkOutlineIcon fontSize="small" color="primary" />}
            />
            <StatTile
              label="Applications"
              value={numberFormat.format(data.applications)}
              caption={`${percent(data.applicationConversion)} of job views`}
              icon={<DescriptionOutlinedIcon fontSize="small" color="primary" />}
            />
            <StatTile
              label="Followers"
              value={numberFormat.format(data.followers)}
              caption={`${data.followerGrowth >= 0 ? '+' : ''}${numberFormat.format(
                data.followerGrowth
              )} in this period`}
              icon={<FavoriteBorderIcon fontSize="small" color="primary" />}
            />
            <StatTile
              label="Hire rate"
              value={percent(data.hireRate)}
              caption="Hires as a share of applications"
              icon={<TrendingUpIcon fontSize="small" color="primary" />}
            />
          </AutoGrid>

          <GlassPanel
            title="Daily activity"
            description={
              isFetching
                ? 'Refreshing…'
                : `${data.from?.slice(0, 10)} to ${data.to?.slice(0, 10)}, one point per day.`
            }
          >
            <TrendChart
              labels={data.series.map((point) => point.date)}
              series={series}
              height={240}
            />
          </GlassPanel>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <GlassPanel
              title="Hiring funnel"
              description="Counts from the applications module for this period."
            >
              <FunnelBars
                stages={[
                  { label: 'Applications', value: data.applications },
                  {
                    label: 'Interviews',
                    value: data.interviews,
                    hint: `${percent(data.interviewRate)} of applications`,
                  },
                  {
                    label: 'Offers',
                    value: data.offers,
                    hint: `${percent(data.offerRate)} of applications`,
                  },
                  {
                    label: 'Hires',
                    value: data.hires,
                    hint: `${percent(data.hireRate)} of applications`,
                  },
                ]}
              />
            </GlassPanel>

            <GlassPanel
              title="Candidate sources"
              description="Where the people who applied came from."
            >
              <BreakdownBars
                data={data.candidateSources}
                labelFor={(key) => SOURCE_LABELS[key] ?? key}
                emptyMessage="No source was recorded for applications in this period."
              />
            </GlassPanel>
          </Box>

          <GlassPanel title="Recruiter activity">
            <Divider sx={{ mb: 1 }} />
            {data.recruiterActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No recruiter actions were recorded in this period.
              </Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" aria-label="Recruiter activity in the selected period">
                  <TableHead>
                    <TableRow>
                      <TableCell>Recruiter</TableCell>
                      <TableCell align="right">Jobs posted</TableCell>
                      <TableCell align="right">Applications reviewed</TableCell>
                      <TableCell align="right">Interviews</TableCell>
                      <TableCell align="right">Hires</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recruiterActivity.map((row) => (
                      <TableRow key={row.userId} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.name || 'Unnamed recruiter'}
                        </TableCell>
                        <TableCell align="right">{numberFormat.format(row.jobsPosted)}</TableCell>
                        <TableCell align="right">
                          {numberFormat.format(row.applicationsReviewed)}
                        </TableCell>
                        <TableCell align="right">{numberFormat.format(row.interviews)}</TableCell>
                        <TableCell align="right">{numberFormat.format(row.hires)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </GlassPanel>
        </>
      ) : null}
    </Stack>
  );
};

export default CompanyAnalytics;
