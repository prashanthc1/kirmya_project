'use client';

/**
 * Hand-built chart primitives for the company analytics screens.
 *
 * The project has no charting dependency, and adding one for four charts is a
 * poor trade. These render plain SVG and MUI boxes from the exact numbers the
 * API returned: no smoothing, no interpolation across gaps and no projected
 * points, so a flat line means the stored series was flat.
 *
 * Each chart carries a text alternative, because a screen reader cannot read a
 * polyline.
 */
import React from 'react';
import { Box, LinearProgress, Stack, Tooltip, Typography, useTheme } from '@mui/material';

const numberFormat = new Intl.NumberFormat();

export interface Series {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface TrendChartProps {
  labels: string[];
  series: Series[];
  height?: number;
}

const shortDate = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** A multi-series line chart drawn straight from the API's daily points. */
export const TrendChart: React.FC<TrendChartProps> = ({ labels, series, height = 220 }) => {
  const theme = useTheme();
  const width = 720;
  const padding = { top: 12, right: 12, bottom: 28, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const visible = series.filter((item) => item.values.length > 0);
  const max = Math.max(1, ...visible.flatMap((item) => item.values));
  const points = labels.length;

  const x = (index: number) =>
    padding.left + (points <= 1 ? plotWidth / 2 : (index / (points - 1)) * plotWidth);
  const y = (value: number) => padding.top + plotHeight - (value / max) * plotHeight;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  // At most six date labels, so the axis stays legible on a phone.
  const labelStep = Math.max(1, Math.ceil(points / 6));

  const summary = visible
    .map((item) => `${item.label}: ${numberFormat.format(item.values.reduce((a, b) => a + b, 0))}`)
    .join('; ');

  if (points === 0 || visible.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No activity was recorded in this period.
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        component="svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Daily totals. ${summary}`}
        sx={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {gridLines.map((ratio) => {
          const lineY = padding.top + plotHeight * (1 - ratio);
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={lineY}
                y2={lineY}
                stroke={theme.palette.divider}
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={lineY + 4}
                textAnchor="end"
                fontSize={11}
                fill={theme.palette.text.secondary}
              >
                {numberFormat.format(Math.round(max * ratio))}
              </text>
            </g>
          );
        })}

        {labels.map((label, index) =>
          index % labelStep === 0 ? (
            <text
              key={label + index}
              x={x(index)}
              y={height - 8}
              textAnchor="middle"
              fontSize={11}
              fill={theme.palette.text.secondary}
            >
              {shortDate(label)}
            </text>
          ) : null
        )}

        {visible.map((item) => (
          <polyline
            key={item.key}
            fill="none"
            stroke={item.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
          />
        ))}
      </Box>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        {visible.map((item) => (
          <Stack key={item.key} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: item.color }} />
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

interface BreakdownBarsProps {
  data: Record<string, number>;
  emptyMessage?: string;
  labelFor?: (key: string) => string;
}

/** Ranked horizontal bars, used for candidate sources. */
export const BreakdownBars: React.FC<BreakdownBarsProps> = ({
  data,
  emptyMessage = 'Nothing has been recorded yet.',
  labelFor,
}) => {
  const entries = Object.entries(data ?? {})
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        {emptyMessage}
      </Typography>
    );
  }

  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <Stack spacing={1.5}>
      {entries.map(([key, value]) => {
        const share = Math.round((value / total) * 100);
        return (
          <Box key={key}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2">{labelFor ? labelFor(key) : key}</Typography>
              <Typography variant="body2" color="text.secondary">
                {numberFormat.format(value)} · {share}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={share}
              aria-label={`${labelFor ? labelFor(key) : key}: ${share} percent`}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        );
      })}
    </Stack>
  );
};

export interface FunnelStage {
  label: string;
  value: number;
  hint?: string;
}

/**
 * A hiring funnel. Each bar is sized against the first stage, and the drop-off
 * shown between stages is arithmetic on the two counts — not a modelled rate.
 */
export const FunnelBars: React.FC<{ stages: FunnelStage[] }> = ({ stages }) => {
  const theme = useTheme();
  const top = Math.max(1, stages[0]?.value ?? 0);

  return (
    <Stack spacing={1.25}>
      {stages.map((stage, index) => {
        const width = Math.max(2, Math.round((stage.value / top) * 100));
        const previous = index > 0 ? stages[index - 1].value : null;
        const conversion =
          previous && previous > 0 ? Math.round((stage.value / previous) * 100) : null;

        return (
          <Box key={stage.label}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {stage.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {numberFormat.format(stage.value)}
                {conversion !== null && ` · ${conversion}% of previous stage`}
              </Typography>
            </Stack>
            <Tooltip title={stage.hint ?? ''} disableHoverListener={!stage.hint}>
              <Box
                sx={{
                  mt: 0.5,
                  height: 12,
                  borderRadius: '6px',
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(99, 102, 241, 0.1)',
                }}
              >
                <Box
                  sx={{
                    width: `${width}%`,
                    height: '100%',
                    borderRadius: '6px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main ?? theme.palette.primary.light})`,
                  }}
                />
              </Box>
            </Tooltip>
          </Box>
        );
      })}
    </Stack>
  );
};
