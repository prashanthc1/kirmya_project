'use client';

/**
 * The company assistant.
 *
 * Every line it shows is computed on the server from this company's own stored
 * rows, and each observation carries the numbers it was derived from. It does
 * not write copy about the company, invent facts about its culture, or
 * paraphrase reviews — if there is nothing in the data, it says so rather than
 * filling the space.
 *
 * Reading it requires the insights permission, and the report is scoped to one
 * company: nothing here is computed across companies.
 */
import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import { useCompanyInsights } from '../../features/company/hooks';
import { CompanyInsight, InsightSeverity } from '../../features/company/types';
import GlassPanel from './GlassPanel';

const PRESETS = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '180 days', days: 180 },
];

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const SEVERITY: Record<
  InsightSeverity,
  { icon: React.ReactNode; color: 'info' | 'success' | 'warning' }
> = {
  info: { icon: <InfoOutlinedIcon fontSize="small" />, color: 'info' },
  suggestion: { icon: <LightbulbOutlinedIcon fontSize="small" />, color: 'success' },
  warning: { icon: <WarningAmberOutlinedIcon fontSize="small" />, color: 'warning' },
};

const InsightCard: React.FC<{ insight: CompanyInsight }> = ({ insight }) => {
  const theme = useTheme();
  const presentation = SEVERITY[insight.severity] ?? SEVERITY.info;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(255, 255, 255, 0.6)',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color: `${presentation.color}.main`, mt: '2px' }}>{presentation.icon}</Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {insight.title}
            </Typography>
            <Chip size="small" variant="outlined" label={insight.category} />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {insight.detail}
          </Typography>

          {insight.evidence.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                Based on
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                {insight.evidence.map((item) => (
                  <Chip key={item} size="small" label={item} />
                ))}
              </Stack>
            </Box>
          )}

          {insight.actions.length > 0 && (
            <List dense sx={{ mt: 0.5, pl: 0 }}>
              {insight.actions.map((action) => (
                <ListItem key={action} sx={{ px: 0, py: 0.25 }}>
                  <ListItemText
                    primary={action}
                    primaryTypographyProps={{ variant: 'body2' }}
                    sx={{ '&::before': { content: '"→ "', color: 'text.secondary' } }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export const AICompanyAssistant: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [days, setDays] = React.useState(90);
  const range = React.useMemo(() => ({ from: daysAgo(days), to: daysAgo(0) }), [days]);

  const { data, isLoading, isError, error, isFetching } = useCompanyInsights(companyId, range, {
    placeholderData: (previous) => previous,
  });

  return (
    <Stack spacing={3}>
      <GlassPanel
        title="Company assistant"
        description="Observations computed from this company's own activity. Each one lists the numbers behind it."
        action={
          <Stack direction="row" spacing={1}>
            {PRESETS.map((preset) => (
              <Button
                key={preset.days}
                size="small"
                variant={days === preset.days ? 'contained' : 'outlined'}
                onClick={() => setDays(preset.days)}
                sx={{ textTransform: 'none' }}
              >
                {preset.label}
              </Button>
            ))}
          </Stack>
        }
      >
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
          <AlertTitle>What this is</AlertTitle>
          These are measurements of your own data, not generated text. Nothing here describes your
          culture, quotes a review, or predicts a result.
        </Alert>

        {isError && (
          <Alert severity="error">
            {error?.message || 'The assistant could not read this company&apos;s activity.'}
          </Alert>
        )}

        {isLoading && !data ? (
          <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={96} sx={{ borderRadius: '16px' }} />
            ))}
          </Stack>
        ) : data ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {data.summary}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.from?.slice(0, 10)} to {data.to?.slice(0, 10)}
              {isFetching ? ' · refreshing…' : ''}
            </Typography>

            <Divider />

            {data.insights.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                There is not enough recorded activity in this period to observe anything.
              </Typography>
            ) : (
              data.insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
            )}
          </Stack>
        ) : null}
      </GlassPanel>

      {data && data.suggestedSkills.length > 0 && (
        <GlassPanel
          title="Skills appearing in your applicants"
          description="Taken from the profiles of people who applied to this company's jobs in this period."
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {data.suggestedSkills.map((skill) => (
              <Chip key={skill} label={skill} variant="outlined" />
            ))}
          </Stack>
        </GlassPanel>
      )}
    </Stack>
  );
};

export default AICompanyAssistant;
