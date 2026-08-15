import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
  Badge,
  Alert,
} from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import CampaignIcon from '@mui/icons-material/Campaign';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { CommunityPost, CommunityComment } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';

interface CommunityFeedProps {
  communityId: string;
  posts: CommunityPost[];
  userRole?: string | null;
  onPostCreated?: (post: CommunityPost) => void;
  onPostUpdated?: () => void;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  communityId,
  posts: initialPosts,
  userRole,
  onPostCreated,
  onPostUpdated,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Comment section state per post
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, CommunityComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Menu state for moderation/post actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activePost, setActivePost] = useState<CommunityPost | null>(null);

  const isStaff = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator';

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    setIsCreating(true);
    try {
      const created = await communityApi.createPost(communityId, {
        title: newTitle.trim() || undefined,
        content: newContent.trim(),
        isAnnouncement,
        isPinned: isAnnouncement,
      });
      setPosts([created, ...posts]);
      setNewTitle('');
      setNewContent('');
      setIsAnnouncement(false);
      if (onPostCreated) onPostCreated(created);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleLike = async (post: CommunityPost) => {
    const res = await communityApi.likePost(communityId, post.id);
    setPosts(
      posts.map((p) =>
        p.id === post.id ? { ...p, likesCount: res.likesCount, userLiked: res.userLiked } : p
      )
    );
  };

  const handleToggleComments = async (postId: string) => {
    const current = expandedComments[postId];
    setExpandedComments({ ...expandedComments, [postId]: !current });
    if (!current && !commentsMap[postId]) {
      const fetched = await communityApi.getComments(communityId, postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: fetched }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    const newCmt = await communityApi.addComment(communityId, postId, text.trim());
    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newCmt],
    }));
    setPosts(
      posts.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, post: CommunityPost) => {
    setAnchorEl(e.currentTarget);
    setActivePost(post);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActivePost(null);
  };

  const handleTogglePin = async () => {
    if (!activePost) return;
    const newPinned = !activePost.isPinned;
    await communityApi.pinPost(communityId, activePost.id, newPinned);
    setPosts(posts.map((p) => (p.id === activePost.id ? { ...p, isPinned: newPinned } : p)));
    handleMenuClose();
    if (onPostUpdated) onPostUpdated();
  };

  const handleToggleLock = async () => {
    if (!activePost) return;
    const newLocked = !activePost.isLocked;
    await communityApi.lockPost(communityId, activePost.id, newLocked);
    setPosts(posts.map((p) => (p.id === activePost.id ? { ...p, isLocked: newLocked } : p)));
    handleMenuClose();
    if (onPostUpdated) onPostUpdated();
  };

  const handleDeletePost = async () => {
    if (!activePost) return;
    await communityApi.deletePost(communityId, activePost.id);
    setPosts(posts.filter((p) => p.id !== activePost.id));
    handleMenuClose();
    if (onPostUpdated) onPostUpdated();
  };

  const handleReportPost = async () => {
    if (!activePost) return;
    await communityApi.reportContent(communityId, activePost.id, 'post', 'Inappropriate content');
    handleMenuClose();
  };

  return (
    <Stack data-testid="community-feed" spacing={3}>
      {/* Create Post Input Box */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '20px',
          background: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(16px)',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(99, 102, 241, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RateReviewIcon color="primary" /> Start a Discussion
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            placeholder="Title / Summary (optional)"
            variant="outlined"
            size="small"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
          />
          <TextField
            placeholder="Share insights, technical architecture questions, or best practices with the group..."
            multiline
            rows={3}
            variant="outlined"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            fullWidth
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {isStaff ? (
              <Chip
                icon={<CampaignIcon />}
                label={isAnnouncement ? 'Post as Official Announcement' : 'Standard Discussion'}
                color={isAnnouncement ? 'secondary' : 'default'}
                onClick={() => setIsAnnouncement(!isAnnouncement)}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
            ) : <Box />}
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreatePost}
              disabled={!newContent.trim() || isCreating}
              endIcon={<SendIcon />}
              sx={{ borderRadius: '12px', fontWeight: 700, px: 3 }}
            >
              {isCreating ? 'Publishing...' : 'Publish Post'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '20px' }}>
          <Typography variant="h6" color="text.secondary">
            No discussions yet in this community. Be the first to publish a post!
          </Typography>
        </Paper>
      ) : (
        posts.map((post) => (
          <Card
            key={post.id}
            data-testid={`post-card-${post.id}`}
            sx={{
              borderRadius: '20px',
              background: (theme) =>
                theme.palette.mode === 'light' ? '#ffffff' : 'rgba(30, 41, 59, 0.75)',
              backdropFilter: 'blur(12px)',
              border: (theme) =>
                post.isAnnouncement
                  ? '2px solid #ec4899'
                  : post.isPinned
                  ? '2px solid #6366f1'
                  : theme.palette.mode === 'light'
                  ? '1px solid rgba(15, 23, 42, 0.08)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Badges Bar */}
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                {post.isPinned && (
                  <Chip
                    icon={<PushPinIcon sx={{ fontSize: 14 }} />}
                    label="Pinned Post"
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700, height: 24 }}
                  />
                )}
                {post.isAnnouncement && (
                  <Chip
                    icon={<CampaignIcon sx={{ fontSize: 14 }} />}
                    label="Announcement"
                    size="small"
                    color="secondary"
                    sx={{ fontWeight: 700, height: 24 }}
                  />
                )}
                {post.isLocked && (
                  <Chip
                    icon={<LockIcon sx={{ fontSize: 14 }} />}
                    label="Comments Locked"
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 700, height: 24 }}
                  />
                )}
              </Stack>

              {/* Author & Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={post.authorAvatar} alt={post.authorName}>
                    {post.authorName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700}>
                        {post.authorName}
                      </Typography>
                      {post.authorRole && (
                        <Chip
                          label={post.authorRole}
                          size="small"
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Box>

                <IconButton onClick={(e) => handleMenuOpen(e, post)} size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>

              {/* Post Title & Content */}
              {post.title && (
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {post.title}
                </Typography>
              )}

              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2.5, lineHeight: 1.6 }}>
                {post.content}
              </Typography>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 2 }}>
                  {post.tags.map((tag) => (
                    <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 1.5 }} />

              {/* Actions Footer */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={3}>
                  <Button
                    size="small"
                    startIcon={post.userLiked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    onClick={() => handleToggleLike(post)}
                    sx={{ color: post.userLiked ? 'error.main' : 'text.secondary', fontWeight: 700 }}
                  >
                    {post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ChatBubbleOutlineIcon />}
                    onClick={() => handleToggleComments(post.id)}
                    sx={{ color: 'text.secondary', fontWeight: 700 }}
                  >
                    {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
                  </Button>
                </Stack>
              </Box>

              {/* Expanded Comments Thread */}
              <Collapse in={!!expandedComments[post.id]} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Comments Thread
                  </Typography>

                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    {(commentsMap[post.id] || []).map((cmt) => (
                      <Box
                        key={cmt.id}
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          bgcolor: (theme) =>
                            theme.palette.mode === 'light' ? 'rgba(241, 245, 249, 0.8)' : 'rgba(15, 23, 42, 0.6)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                          <Avatar src={cmt.authorAvatar} sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                            {cmt.authorName.charAt(0)}
                          </Avatar>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {cmt.authorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ pl: 5 }}>
                          {cmt.content}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  {!post.isLocked ? (
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        placeholder="Write a comment..."
                        fullWidth
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment(post.id))}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                      >
                        Comment
                      </Button>
                    </Stack>
                  ) : (
                    <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                      Comments are locked on this post by community moderators.
                    </Alert>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))
      )}

      {/* Post Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {isStaff && (
          <MenuItem onClick={handleTogglePin}>
            <PushPinIcon fontSize="small" sx={{ mr: 1 }} />
            {activePost?.isPinned ? 'Unpin Post' : 'Pin Post'}
          </MenuItem>
        )}
        {isStaff && (
          <MenuItem onClick={handleToggleLock}>
            {activePost?.isLocked ? <LockOpenIcon fontSize="small" sx={{ mr: 1 }} /> : <LockIcon fontSize="small" sx={{ mr: 1 }} />}
            {activePost?.isLocked ? 'Unlock Comments' : 'Lock Comments'}
          </MenuItem>
        )}
        {isStaff && (
          <MenuItem onClick={handleDeletePost} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete Post
          </MenuItem>
        )}
        <MenuItem onClick={handleReportPost}>
          <FlagIcon fontSize="small" sx={{ mr: 1 }} /> Report to Moderator
        </MenuItem>
      </Menu>
    </Stack>
  );
};
