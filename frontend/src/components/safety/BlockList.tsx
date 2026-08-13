'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Stack,
  Alert,
  useTheme,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

export const BlockList: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [blocked, setBlocked] = useState([
    { id: 'usr-1', name: 'John Doe', type: 'User Account' },
    { id: 'rec-2', name: 'Apex Recruiters Agency', type: 'Recruiter' },
  ]);

  const handleUnblock = (id: string) => {
    setBlocked(blocked.filter((b) => b.id !== id));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <BlockIcon sx={{ color: '#f59e0b', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Blocked Accounts
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Blocked users, recruiters, and companies cannot send direct messages or connection requests.
      </Typography>

      {blocked.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          You have no blocked accounts.
        </Alert>
      ) : (
        <Card
          sx={{
            borderRadius: '24px',
            p: 2,
            bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <List>
            {blocked.map((b) => (
              <ListItem key={b.id} divider>
                <ListItemText primary={b.name} secondary={b.type} primaryTypographyProps={{ fontWeight: 800 }} />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => handleUnblock(b.id)}
                    sx={{ borderRadius: '8px', fontWeight: 700 }}
                  >
                    Unblock
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
};

export default BlockList;
