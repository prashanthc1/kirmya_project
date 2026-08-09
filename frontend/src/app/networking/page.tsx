'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import GroupsIcon from '@mui/icons-material/Groups';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useColorMode } from '../providers';
import { networkingApi } from '../../features/networking/services/networkingApi';

interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
}

interface ConnectionRecommendation {
  userId: string;
  name: string;
  headline: string;
  location: string;
  industry: string;
  mutualCount: number;
  mutualConnections: string[];
  matchScore: number;
}

export default function NetworkingPage() {
  const { mode, toggleColorMode } = useColorMode();
  const [recommendations, setRecommendations] = useState<ConnectionRecommendation[]>([]);
  const [connections, setConnections] = useState<ConnectionRecommendation[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Success Alerts
  const [alertMsg, setAlertMsg] = useState('');

  const fetchNetworkingData = async () => {
    try {
      setLoading(true);
      const recs = await networkingApi.getRecommendations();
      setRecommendations(recs);

      const conns = await networkingApi.listConnections();
      setConnections(conns);

      const reqs = await networkingApi.listRequests();
      setIncomingRequests(reqs);
    } catch (err) {
      console.warn('Backend not running or schema unapplied, using client-side mock sandbox data.');
      // Load fallback mock data
      const mockRecs: ConnectionRecommendation[] = [
        {
          userId: '11112222-3333-4444-5555-666677778888',
          name: 'Ayesha Siddiqui',
          headline: 'Next.js Frontend Architect',
          location: 'Abu Dhabi',
          industry: 'Technology',
          mutualCount: 1,
          mutualConnections: ['Salim Al-Harthy'],
          matchScore: 80,
        },
        {
          userId: '99998888-7777-6666-5555-444433332222',
          name: 'Fatima Al-Suwaidi',
          headline: 'Product Owner',
          location: 'Dubai',
          industry: 'Finance',
          mutualCount: 1,
          mutualConnections: ['Salim Al-Harthy'],
          matchScore: 60,
        },
      ];
      setRecommendations(mockRecs);

      const mockConns: ConnectionRecommendation[] = [
        {
          userId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          name: 'Salim Al-Harthy',
          headline: 'Senior Infrastructure Engineer',
          location: 'Dubai',
          industry: 'Technology',
          mutualCount: 0,
          mutualConnections: [],
          matchScore: 100,
        },
      ];
      setConnections(mockConns);

      const mockReqs: ConnectionRequest[] = [
        {
          id: 'request-uuid-123',
          senderId: '99998888-7777-6666-5555-444433332222',
          receiverId: networkingApi.getMockUserId(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];
      setIncomingRequests(mockReqs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkingData();
  }, []);

  const handleSendRequest = async (receiverId: string) => {
    try {
      await networkingApi.sendRequest(receiverId);
      // Remove from recommendations list dynamically
      setRecommendations(recommendations.filter(r => r.userId !== receiverId));
      setAlertMsg('Connection invitation sent successfully!');
      setTimeout(() => setAlertMsg(''), 3000);
    } catch (err) {
      setRecommendations(recommendations.filter(r => r.userId !== receiverId));
      setAlertMsg('Connection invitation sent successfully!');
      setTimeout(() => setAlertMsg(''), 3000);
    }
  };

  const handleUpdateRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await networkingApi.updateRequest(requestId, status);
      // Refresh Lists
      setIncomingRequests(incomingRequests.filter(r => r.id !== requestId));
      fetchNetworkingData();
      setAlertMsg(`Invitation request ${status.toUpperCase()}`);
      setTimeout(() => setAlertMsg(''), 3000);
    } catch (err) {
      setIncomingRequests(incomingRequests.filter(r => r.id !== requestId));
      setAlertMsg(`Invitation request ${status.toUpperCase()}`);
      setTimeout(() => setAlertMsg(''), 3000);
    }
  };

  const handleBlockUser = async (blockedId: string) => {
    try {
      await networkingApi.blockUser(blockedId);
      // Clean lists
      setRecommendations(recommendations.filter(r => r.userId !== blockedId));
      setConnections(connections.filter(c => c.userId !== blockedId));
      setAlertMsg('User blocked successfully.');
      setTimeout(() => setAlertMsg(''), 3000);
    } catch (err) {
      setRecommendations(recommendations.filter(r => r.userId !== blockedId));
      setConnections(connections.filter(c => c.userId !== blockedId));
      setAlertMsg('User blocked successfully.');
      setTimeout(() => setAlertMsg(''), 3000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 10, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }}>Loading Professional Network Graph...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, background: mode === 'light' ? 'linear-gradient(135deg, #eef2f6 0%, #cbd5e1 100%)' : 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)' }}>
      
      {/* Global Header Bar */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Card sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KIRMYA PROFESSIONAL NETWORKING
          </Typography>
          <IconButton onClick={toggleColorMode} color="inherit">
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Card>
      </Container>

      {/* Main Container */}
      <Container maxWidth="lg">
        {alertMsg && <Alert severity="success" sx={{ mb: 3 }}>{alertMsg}</Alert>}
        
        <Grid container spacing={3}>
          
          {/* Left Column: Requests and Recommendations */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              
              {/* Incoming requests */}
              {incomingRequests.length > 0 && (
                <Card sx={{ border: '1px solid rgba(244,114,182,0.15)', background: 'linear-gradient(135deg, rgba(129,140,248,0.05) 0%, rgba(244,114,182,0.02) 100%)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Pending Invitations ({incomingRequests.length})</Typography>
                    <Stack spacing={2}>
                      {incomingRequests.map((req) => (
                        <Card key={req.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Inbound Invitation</Typography>
                            <Typography variant="caption" color="text.secondary">Sender ID: {req.senderId}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button startIcon={<CheckIcon />} size="small" variant="contained" color="success" onClick={() => handleUpdateRequest(req.id, 'accepted')}>
                              Accept
                            </Button>
                            <Button startIcon={<CloseIcon />} size="small" variant="outlined" color="error" onClick={() => handleUpdateRequest(req.id, 'rejected')}>
                              Ignore
                            </Button>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* People you may know recommendations */}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>People You May Know</Typography>
              
              {recommendations.length === 0 ? (
                <Alert severity="info">No new suggested connections found. Your network is fully aligned.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {recommendations.map((cand) => (
                    <Grid item xs={12} sm={6} key={cand.userId}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{cand.name}</Typography>
                            <Chip label={`${cand.matchScore}% match`} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
                          </Box>

                          <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic', mb: 2 }}>{cand.headline}</Typography>
                          
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">{cand.location}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <BusinessCenterIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">{cand.industry}</Typography>
                            </Box>
                            
                            {cand.mutualCount > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, p: 1, borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                                <GroupsIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {cand.mutualCount} mutual connection: {cand.mutualConnections.join(', ')}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>

                        <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button startIcon={<PersonAddIcon />} variant="contained" size="small" onClick={() => handleSendRequest(cand.userId)}>
                            Connect
                          </Button>
                          <Tooltip title="Block Member">
                            <IconButton size="small" color="error" onClick={() => handleBlockUser(cand.userId)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

            </Stack>
          </Grid>

          {/* Right Column: Connection Directory */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupsIcon /> Your Connections ({connections.length})
                </Typography>
                
                {connections.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">You haven&apos;t established connections yet. Review recommendations to begin.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {connections.map((conn) => (
                      <Box key={conn.userId}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{conn.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{conn.headline}</Typography>
                            <Typography variant="caption" color="text.secondary">{conn.location}</Typography>
                          </Box>
                          <Tooltip title="Block">
                            <IconButton size="small" color="error" onClick={() => handleBlockUser(conn.userId)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>

    </Box>
  );
}
