import { SpacingOptions } from '@mui/system';

/**
 * Spacing Rhythm & Content Constraints (Prompt 13/50)
 * 
 * Base unit: 8px.
 * Multipliers: 0.5 (4px), 1 (8px), 1.5 (12px), 2 (16px), 3 (24px), 4 (32px), 6 (48px), 8 (64px).
 */

export const spacing: SpacingOptions = 8;

export const layoutWidths = {
  narrow: 640,
  standard: 1024,
  wide: 1280,
  max: 1440,
} as const;
