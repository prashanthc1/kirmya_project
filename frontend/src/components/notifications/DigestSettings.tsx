'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  MenuItem,
  TextField,
  Stack,
  Button,
  Alert,
  useTheme,
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

export const DigestSettings: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [frequency, setFrequency] = useState('Daily Digest');
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: { xs: 3, md: 4 },
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <MarkEmailReadIcon sx={{ color: '#10b981', fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Notification Email Digest Summaries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bundle non-urgent job recommendations and career milestones into a single email summary.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Digest Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <MenuItem value="Instant">Instant (No Digesting)</MenuItem>
            <MenuItem value="Daily Digest">Daily Digest (Once Per Day)</MenuItem>
            <MenuItem value="Weekly Digest">Weekly Digest (Mondays)</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Preferred Delivery Time"
            type="time"
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      {saved && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
          Digest preferences updated!
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleSave}
        sx={{
          borderRadius: '12px',
          fontWeight: 800,
          px: 4,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        }}
      >
        Save Digest Settings
      </Button>
    </Card>
  );
};

export default DigestSettings;
