'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  Stack,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  useTheme,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockIcon from '@mui/icons-material/Lock';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { safetyApi } from '../../features/trust_safety/api';
import { UserRestriction } from '../../features/trust_safety/types';
import AppealForm from './AppealForm';

export const AccountRestrictions: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppeal, setShowAppeal] = useState(false);

  useEffect(() => {
    let mounted = true;
    safetyApi
      .getUserRestrictions()
      .then((res) => {
        if (mounted) {
          setRestrictions(res || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeRestrictions = restrictions.filter((r) => r.status === 'active');

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <LockIcon color="warning" sx={{ fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Account Status & Active Restrictions
        </Typography>
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review active account restrictions, policy violation explanations, and appeal options.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : activeRestrictions.length === 0 ? (
        <Alert
          icon={<CheckCircleIcon fontSize="inherit" />}
          severity="success"
          sx={{ borderRadius: '16px', p: 3, fontWeight: 700 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Account in Good Standing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            No active restrictions or moderation enforcement notices on your Kirmya account.
          </Typography>
        </Alert>
      ) : (
        <Stack spacing={3}>
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: '16px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {activeRestrictions.length} Active Account {activeRestrictions.length === 1 ? 'Restriction' : 'Restrictions'} Enforced
            </Typography>
            <Typography variant="body2">
              Certain features on your account are temporarily limited to preserve platform security.
            </Typography>
          </Alert>

          <Card
            sx={{
              borderRadius: '24px',
              p: 3,
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <List disablePadding>
              {activeRestrictions.map((item) => (
                <ListItem
                  key={item.id}
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    py: 2,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Chip
                          label={item.restriction_type.toUpperCase().replace('_', ' ')}
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {item.user_name || 'Account Restriction'}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                          <strong>Reason:</strong> {item.reason}
                        </Typography>
                        {item.expires_at && (
                          <Typography variant="caption" color="text.secondary">
                            Expires: {new Date(item.expires_at).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<GavelIcon />}
                    onClick={() => setShowAppeal(!showAppeal)}
                    sx={{ borderRadius: '12px', fontWeight: 800, mt: { xs: 1.5, sm: 0 } }}
                  >
                    {showAppeal ? 'Hide Appeal Form' : 'Submit Appeal'}
                  </Button>
                </ListItem>
              ))}
            </List>
          </Card>

          {showAppeal && (
            <Box sx={{ mt: 2 }}>
              <AppealForm />
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default AccountRestrictions;
