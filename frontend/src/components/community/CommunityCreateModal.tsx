import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  TextField,
  Typography,
  Stack,
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';
import { communityApi } from '../../features/community/services/communityApi';
import { Community } from '../../features/community/types';

interface CommunityCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (newCommunity: Community) => void;
}

const steps = ['Basic Info', 'Topics & Rules', 'Privacy & Permissions'];

const CATEGORIES = [
  'Engineering & Cloud',
  'Artificial Intelligence',
  'Finance & Banking',
  'Product & Design',
  'Healthcare & BioTech',
  'Executive Leadership',
  'General Professional',
];

export const CommunityCreateModal: React.FC<CommunityCreateModalProps> = ({ open, onClose, onCreated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('Remote / Global');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>(['Tech', 'Innovation']);

  const [ruleInput, setRuleInput] = useState('');
  const [rules, setRules] = useState<string[]>([
    'Maintain professional courtesy at all times.',
    'No unauthorized promotional spam.',
  ]);

  const [isPrivate, setIsPrivate] = useState(false);
  const [postingPermission, setPostingPermission] = useState<'all' | 'mods_only' | 'approved_only'>('all');

  const handleAddTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  const handleAddRule = () => {
    if (ruleInput.trim()) {
      setRules([...rules, ruleInput.trim()]);
      setRuleInput('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleNext = () => {
    if (activeStep === 0 && !title.trim()) {
      setError('Community Title is required.');
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const created = await communityApi.createCommunity({
        title,
        description,
        category,
        location,
        isPrivate,
        topics,
        rules,
        postingPermission,
      });
      setLoading(false);
      onClose();
      if (onCreated) {
        onCreated(created);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create community');
      setLoading(false);
    }
  };

  return (
    <Dialog
      data-testid="community-create-modal"
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <GroupsIcon color="primary" fontSize="large" /> Create New Professional Community
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 380 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4, pt: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {/* Step 1: Basic Info */}
        {activeStep === 0 && (
          <Stack spacing={3}>
            <TextField
              label="Community Name / Title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems & High-Scale Engineers"
            />
            <TextField
              label="Description"
              required
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the mission, goals, and target audience for this group..."
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Primary Industry Category"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                SelectProps={{ native: true }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </TextField>
              <TextField
                label="Location / Region"
                fullWidth
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA / Global Remote"
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Avatar URL (Optional)"
                fullWidth
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
              <TextField
                label="Cover Image URL (Optional)"
                fullWidth
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </Stack>
          </Stack>
        )}

        {/* Step 2: Topics & Rules */}
        {activeStep === 1 && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Topics & Hashtags
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add topic (e.g. SystemDesign)"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                />
                <Button variant="outlined" onClick={handleAddTopic} startIcon={<AddIcon />}>
                  Add
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {topics.map((topic) => (
                  <Chip
                    key={topic}
                    label={`#${topic}`}
                    onDelete={() => handleRemoveTopic(topic)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>

            <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Community Rules
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter community rule statement..."
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                />
                <Button variant="outlined" onClick={handleAddRule} startIcon={<AddIcon />}>
                  Add
                </Button>
              </Stack>
              <Stack spacing={1}>
                {rules.map((rule, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: '10px',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {idx + 1}. {rule}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => handleRemoveRule(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}

        {/* Step 3: Privacy & Permissions */}
        {activeStep === 2 && (
          <Stack spacing={3}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Private Community
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      When enabled, members must request approval or receive an invitation to join and view posts.
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
                Posting & Discussion Permissions
              </FormLabel>
              <RadioGroup
                value={postingPermission}
                onChange={(e: any) => setPostingPermission(e.target.value)}
              >
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label="All Members can start discussions and post"
                />
                <FormControlLabel
                  value="approved_only"
                  control={<Radio />}
                  label="Approved Members only (Moderators review initial posts)"
                />
                <FormControlLabel
                  value="mods_only"
                  control={<Radio />}
                  label="Admins & Moderators only (Members can comment)"
                />
              </RadioGroup>
            </FormControl>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button disabled={activeStep === 0 || loading} onClick={handleBack} variant="outlined">
          Back
        </Button>
        <Box>
          <Button onClick={onClose} sx={{ mr: 1.5 }}>
            Cancel
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Community'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};
