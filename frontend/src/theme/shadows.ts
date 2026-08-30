import { Shadows } from '@mui/material/styles';

/**
 * Restrained Elevation & Shadows (Prompt 13/50)
 * 
 * Soft ambient occlusion combined with 1px borders instead of harsh black drops.
 */

export const getShadows = (mode: 'light' | 'dark'): Shadows => {
  const isLight = mode === 'light';

  const emptyShadows = [
    'none',
    isLight ? '0 1px 2px 0 rgba(15, 23, 42, 0.05)' : '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    isLight ? '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)' : '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
    isLight ? '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)' : '0 4px 6px -1px rgba(0, 0, 0, 0.45)',
    isLight ? '0 8px 16px -2px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)' : '0 8px 16px -2px rgba(0, 0, 0, 0.5)',
    isLight ? '0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 6px 12px -6px rgba(15, 23, 42, 0.04)' : '0 12px 24px -4px rgba(0, 0, 0, 0.55)',
    isLight ? '0 16px 32px -4px rgba(15, 23, 42, 0.1), 0 8px 16px -8px rgba(15, 23, 42, 0.06)' : '0 16px 32px -4px rgba(0, 0, 0, 0.6)',
    isLight ? '0 20px 40px -4px rgba(15, 23, 42, 0.12), 0 10px 20px -8px rgba(15, 23, 42, 0.08)' : '0 20px 40px -4px rgba(0, 0, 0, 0.65)',
    isLight ? '0 24px 48px -4px rgba(15, 23, 42, 0.14)' : '0 24px 48px -4px rgba(0, 0, 0, 0.7)',
  ];

  // Fill up to 25 items for MUI Shadows tuple
  const shadowsArray = [...emptyShadows];
  while (shadowsArray.length < 25) {
    shadowsArray.push(shadowsArray[shadowsArray.length - 1]);
  }

  return shadowsArray as unknown as Shadows;
};
