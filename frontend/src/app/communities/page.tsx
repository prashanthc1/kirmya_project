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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useColorMode } from '../providers';
import { communityApi } from '../../features/community/services/communityApi';

interface Community {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  isPrivate: boolean;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  communityId: string;
  userId: string;
  content: string;
  createdAt: string;
  userName?: string;
}

export default function CommunitiesPage() {
  const { mode, toggleColorMode } = useColorMode();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Active membership state (mocking role & status for selected community)
  const [myMembership, setMyMembership] = useState<{ role: string; status: string } | null>(null);

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('industry');
  const [newLocation, setNewLocation] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [postContent, setPostContent] = useState('');

  const [alertMsg, setAlertMsg] = useState('');

  const fetchCommunitiesList = async () => {
    try {
      setLoading(true);
      const list = await communityApi.listCommunities();
      setCommunities(list);
      if (list.length > 0 && !selectedComm) {
        handleSelectCommunity(list[0]);
      }
    } catch (err) {
      console.warn('Backend not running or schema unapplied, using client-side mock sandbox data.');
      // Load fallback mock data
      const mockComms: Community[] = [
        {
          id: 'comm-uuid-1',
          title: 'Golang Architects Middle East',
          description: 'A professional hub discussing modular monolith designs, microservices migrations, pgvector similarity searches, and high-performance Go structures.',
          category: 'industry',
          location: 'Dubai',
          isPrivate: false,
          createdAt: '2026-07-24T10:00:00Z',
        },
        {
          id: 'comm-uuid-2',
          title: 'Abu Dhabi SRE & Cloud Operators',
          description: 'Discussing Prometheus, Grafana alerts, OpenTelemetry trace spans, and Cloudflare R2 configurations.',
          category: 'location',
          location: 'Abu Dhabi',
          isPrivate: false,
          createdAt: '2026-07-24T11:00:00Z',
        },
        {
          id: 'comm-uuid-3',
          title: 'Private FinTech Engineering Group',
          description: 'Exclusive workspace for senior engineering leads discussing payments, ledger consistency patterns, and NATS JetStream event publishing.',
          category: 'trending',
          location: 'Dubai',
          isPrivate: true,
          createdAt: '2026-07-24T12:00:00Z',
        },
      ];
      setCommunities(mockComms);
      if (!selectedComm) {
        handleSelectCommunity(mockComms[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunitiesList();
  }, []);

  const handleSelectCommunity = async (comm: Community) => {
    setSelectedComm(comm);
    setPosts([]);

    // Check membership role for this community
    // In mock fallback: user is Owner of first community, Member of second, and Guest (non-member) of the private FinTech group
    if (comm.id === 'comm-uuid-1') {
      setMyMembership({ role: 'owner', status: 'active' });
    } else if (comm.id === 'comm-uuid-2') {
      setMyMembership({ role: 'member', status: 'active' });
    } else {
      setMyMembership(null);
    }

    try {
      const feed = await communityApi.listPosts(comm.id);
      setPosts(feed);
    } catch (err) {
      // Load fallback mock posts
      const mockPosts: CommunityPost[] = [
        {
          id: 'post-1',
          communityId: comm.id,
          userId: 'user-1',
          userName: 'Salim Al-Harthy',
          content: 'Does anyone have a standard structure for logging pgx connection pool metrics to Prometheus?',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'post-2',
          communityId: comm.id,
          userId: 'user-2',
          userName: 'Ayesha Siddiqui',
          content: 'I highly suggest using the OpenTelemetry collector package. We mapped it on Next.js edge routers and latency metrics look clean.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      // Only show posts if public or member
      if (!comm.isPrivate || (myMembership && myMembership.status === 'active')) {
        setPosts(mockPosts);
      }
    }
  };

  const handleCreateCommunity = async () => {
    if (!newTitle) return;
    try {
      const created = await communityApi.createCommunity({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        location: newLocation,
        isPrivate: newIsPrivate,
      });
      setCommunities([...communities, created]);
      handleSelectCommunity(created);
    } catch (err) {
      const mockCreated: Community = {
        id: Math.random().toString(),
        title: newTitle,
        description: newDesc,
        category: newCategory,
        location: newLocation,
        isPrivate: newIsPrivate,
        createdAt: new Date().toISOString(),
      };
      setCommunities([...communities, mockCreated]);
      handleSelectCommunity(mockCreated);
    }
    setNewTitle('');
    setNewDesc('');
    setNewCategory('industry');
    setNewLocation('');
    setNewIsPrivate(false);
    setCreateOpen(false);
  };

  const handleJoin = async (id: string) => {
    try {
      await communityApi.joinCommunity(id);
      setMyMembership({ role: 'member', status: selectedComm?.isPrivate ? 'pending' : 'active' });
      setAlertMsg(selectedComm?.isPrivate ? 'Join request submitted to admins.' : 'Joined community successfully!');
      setTimeout(() => setAlertMsg(''), 4000);
      if (selectedComm) {
        handleSelectCommunity(selectedComm);
      }
    } catch (err) {
      setMyMembership({ role: 'member', status: selectedComm?.isPrivate ? 'pending' : 'active' });
      setAlertMsg(selectedComm?.isPrivate ? 'Join request submitted to admins.' : 'Joined community successfully!');
      setTimeout(() => setAlertMsg(''), 4000);
    }
  };

  const handleCreatePost = async () => {
    if (!selectedComm || !postContent) return;
    try {
      const newPost = await communityApi.createPost(selectedComm.id, postContent);
      newPost.userName = 'You (Owner)';
      setPosts([newPost, ...posts]);
      setPostContent('');
    } catch (err) {
      const mockPost: CommunityPost = {
        id: Math.random().toString(),
        communityId: selectedComm.id,
        userId: communityApi.getMockUserId(),
        userName: 'You',
        content: postContent,
        createdAt: new Date().toISOString(),
      };
      setPosts([mockPost, ...posts]);
      setPostContent('');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!selectedComm) return;
    try {
      await communityApi.deletePost(selectedComm.id, postId);
      setPosts(posts.filter(p => p.id !== postId));
      setAlertMsg('Post moderated and deleted.');
      setTimeout(() => setAlertMsg(''), 3000);
    } catch (err) {
      setPosts(posts.filter(p => p.id !== postId));
      setAlertMsg('Post moderated and deleted.');
      setTimeout(() => setAlertMsg(''), 3000);
    }
  };

  const handleReportPost = async () => {
    if (!selectedPostId || !reportReason) return;
    try {
      await communityApi.reportPost(selectedPostId, reportReason);
      setAlertMsg('Post reported for moderation review.');
      setTimeout(() => setAlertMsg(''), 3000);
    } catch (err) {
      setAlertMsg('Post reported for moderation review.');
      setTimeout(() => setAlertMsg(''), 3000);
    }
    setReportOpen(false);
    setReportReason('');
    setSelectedPostId(null);
  };

  // Helper check if user can moderate posts
  const canModerate = myMembership && (myMembership.role === 'owner' || myMembership.role === 'admin' || myMembership.role === 'moderator');

  return (
    <Box sx={{ minHeight: '100vh', py: 4, background: mode === 'light' ? 'linear-gradient(135deg, #eef2f6 0%, #cbd5e1 100%)' : 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)' }}>
      
      {/* Global Header Bar */}
      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Card sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KIRMYA CAREER COMMUNITIES
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateOpen(true)}>
              Create Community
            </Button>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Stack>
        </Card>
      </Container>

      {/* Main Workspace */}
      <Container maxWidth="xl">
        {alertMsg && <Alert severity="success" sx={{ mb: 3 }}>{alertMsg}</Alert>}
        
        <Grid container spacing={3}>
          
          {/* Left panel: Discovery list */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Discover Communities</Typography>
                
                {communities.length === 0 ? (
                  <Alert severity="info">No career communities created yet. Create one to begin building the professional ecosystem.</Alert>
                ) : (
                  <Stack spacing={2}>
                    {communities.map((comm) => (
                      <Card 
                        key={comm.id} 
                        onClick={() => handleSelectCommunity(comm)}
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedComm?.id === comm.id ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.05)',
                          backgroundColor: selectedComm?.id === comm.id ? 'rgba(99,102,241,0.03)' : 'inherit'
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{comm.title}</Typography>
                            {comm.isPrivate ? <LockIcon fontSize="small" color="secondary" /> : <PublicIcon fontSize="small" color="disabled" />}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {comm.description}
                          </Typography>

                          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                            <Chip label={comm.category} size="small" icon={<CategoryIcon />} variant="outlined" />
                            {comm.location && <Chip label={comm.location} size="small" icon={<LocationOnIcon />} variant="outlined" />}
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right panel: Active workspace post board */}
          <Grid item xs={12} lg={8}>
            {selectedComm ? (
              <Stack spacing={3}>
                
                {/* Active Group Details */}
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedComm.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{selectedComm.description}</Typography>
                      </Box>
                      
                      {/* Join / Status indicator */}
                      {!myMembership ? (
                        <Button variant="contained" startIcon={<GroupsIcon />} onClick={() => handleJoin(selectedComm.id)}>
                          {selectedComm.isPrivate ? 'Request to Join' : 'Join'}
                        </Button>
                      ) : (
                        <Chip 
                          label={myMembership.status === 'pending' ? 'Request Pending' : `Member (${myMembership.role.toUpperCase()})`} 
                          color={myMembership.status === 'pending' ? 'warning' : 'success'} 
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Main Content Board */}
                {selectedComm.isPrivate && (!myMembership || myMembership.status !== 'active') ? (
                  <Card sx={{ p: 4, textAlign: 'center' }}>
                    <LockIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Private Community board restricted</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Submit a request to join this space to participate in posts.</Typography>
                  </Card>
                ) : (
                  <Stack spacing={3}>
                    
                    {/* Share Post */}
                    {myMembership && myMembership.status === 'active' && (
                      <Card>
                        <CardContent sx={{ p: 2 }}>
                          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                            <TextField 
                              label="Share professional advice or ask a career question..." 
                              multiline 
                              rows={2} 
                              fullWidth 
                              value={postContent}
                              onChange={(e) => setPostContent(e.target.value)}
                            />
                            <Button 
                              variant="contained" 
                              color="primary" 
                              onClick={handleCreatePost}
                              sx={{ height: '56px', minWidth: '80px' }}
                            >
                              <SendIcon />
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    )}

                    {/* Posts list */}
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Discussion Feed</Typography>
                      
                      {posts.length === 0 ? (
                        <Alert severity="info">Discussion board is quiet. Start the conversation by posting above.</Alert>
                      ) : (
                        posts.map((post) => (
                          <Card key={post.id} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{post.userName || 'Anonymous specialist'}</Typography>
                                <Typography variant="caption" color="text.secondary">{new Date(post.createdAt).toLocaleString()}</Typography>
                              </Box>
                              
                              <Stack direction="row" spacing={1}>
                                {canModerate && (
                                  <Tooltip title="Delete Post">
                                    <IconButton size="small" color="error" onClick={() => handleDeletePost(post.id)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Flag / Report">
                                  <IconButton size="small" onClick={() => { setSelectedPostId(post.id); setReportOpen(true); }}>
                                    <FlagIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Box>

                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{post.content}</Typography>
                          </Card>
                        ))
                      )}
                    </Stack>

                  </Stack>
                )}

              </Stack>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <GroupsIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
                <Typography sx={{ color: 'text.secondary' }}>Select a community workspace from the discover vault list.</Typography>
              </Box>
            )}
          </Grid>

        </Grid>
      </Container>

      {/* ----------------- DIALOG MODALS ----------------- */}

      {/* Create Community Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Career Community</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Community Title" fullWidth value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <TextField label="Workspace Description" multiline rows={3} fullWidth value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={newCategory} label="Category" onChange={(e) => setNewCategory(e.target.value)}>
                <MenuItem value="trending">Trending Workspace</MenuItem>
                <MenuItem value="industry">Industry Specialization</MenuItem>
                <MenuItem value="location">Location-based Chapter</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Location (e.g. Dubai, Abu Dhabi)" fullWidth value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
            
            <FormControl fullWidth>
              <InputLabel>Privacy Status</InputLabel>
              <Select value={newIsPrivate ? 'private' : 'public'} label="Privacy Status" onChange={(e) => setNewIsPrivate(e.target.value === 'private')}>
                <MenuItem value="public">Public (anyone can join)</MenuItem>
                <MenuItem value="private">Private (requires admin invite approval)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCommunity} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Report Post Modal */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)}>
        <DialogTitle>Report Post Content</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField 
            label="Provide reason for flag reporting..." 
            multiline 
            rows={2} 
            fullWidth 
            value={reportReason} 
            onChange={(e) => setReportReason(e.target.value)} 
            sx={{ minWidth: '300px', mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button onClick={handleReportPost} color="error" variant="contained">Report</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
