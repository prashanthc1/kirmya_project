'use client';

import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Button, Chip } from '@mui/material';
import { CoverLetterTemplate } from '@/features/cover-letter/types';

export interface CoverLetterTemplateSelectorProps {
  templates: CoverLetterTemplate[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
}

export const CoverLetterTemplateSelector: React.FC<CoverLetterTemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelect,
}) => {
  return (
    <Grid container spacing={3}>
      {templates.map((t) => {
        const isSelected = selectedTemplateId === t.id;
        return (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card
              sx={{
                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#6366f1',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)',
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={700}>
                    {t.name}
                  </Typography>
                  <Chip label={t.category} size="small" sx={{ background: 'rgba(255,255,255,0.1)' }} />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {t.description}
                </Typography>
                <Typography variant="caption" color="#818cf8" display="block" mb={2}>
                  <strong>Recommended for:</strong> {t.recommendedUse}
                </Typography>
                <Button
                  fullWidth
                  variant={isSelected ? 'contained' : 'outlined'}
                  onClick={() => onSelect(t.id)}
                  sx={{ borderRadius: 2 }}
                >
                  {isSelected ? 'Selected Template' : 'Use Template'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};
