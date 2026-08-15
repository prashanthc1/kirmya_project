import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import { MentorProfile } from '../../features/mentorship/types';

interface MentorProfileEditorProps {
  profile: MentorProfile;
  onSave: (updatedProfile: Partial<MentorProfile>) => Promise<void>;
}

export const MentorProfileEditor: React.FC<MentorProfileEditorProps> = ({ profile, onSave }) => {
  const [bio, setBio] = useState(profile.bio || '');
  const [title, setTitle] = useState(profile.title || '');
  const [company, setCompany] = useState(profile.company || '');
  const [industry, setIndustry] = useState(profile.industry || '');
  const [experienceYears, setExperienceYears] = useState(profile.experience_years || 5);
  const [availability, setAvailability] = useState(profile.availability || 'available');
  const [maxMentees, setMaxMentees] = useState(profile.capacity?.max_mentees || 5);
  const [pricingModel, setPricingModel] = useState(profile.pricing_model || 'free');
  const [rate, setRate] = useState(profile.rate || 0);

  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [topics, setTopics] = useState<string[]>(profile.topics || []);
  const [newTopicInput, setNewTopicInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddTopic = () => {
    if (newTopicInput.trim() && !topics.includes(newTopicInput.trim())) {
      setTopics([...topics, newTopicInput.trim()]);
      setNewTopicInput('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter((t) => t !== topicToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await onSave({
        bio,
        title,
        company,
        industry,
        experience_years: Number(experienceYears),
        availability,
        capacity: {
          max_mentees: Number(maxMentees),
          current_mentees: profile.capacity?.current_mentees || 0,
        },
        pricing_model: pricingModel,
        rate: pricingModel === 'paid' ? Number(rate) : 0,
        skills,
        topics,
      });
      setSuccessMsg('Mentor profile preferences updated successfully!');
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(255, 255, 255, 0.6)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      <CardContent sx={{ p: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <TuneIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Mentor Profile & Capacity Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your availability, mentee limit, offerings, and skill topics
            </Typography>
          </Box>
        </Box>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
            {successMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Title & Company */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Headline Title"
                fullWidth
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company / Organization"
                fullWidth
                size="small"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </Grid>

            {/* Industry & Experience */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Industry"
                fullWidth
                size="small"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Years of Experience"
                type="number"
                fullWidth
                size="small"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
              />
            </Grid>

            {/* Availability Status & Capacity */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="availability-status-label">Availability Status</InputLabel>
                <Select
                  labelId="availability-status-label"
                  label="Availability Status"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as any)}
                >
                  <MenuItem value="available">Available for New Mentees</MenuItem>
                  <MenuItem value="busy">Limited Spots Available</MenuItem>
                  <MenuItem value="unavailable">Not Taking Mentees</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Mentee Capacity"
                type="number"
                fullWidth
                size="small"
                value={maxMentees}
                onChange={(e) => setMaxMentees(Number(e.target.value))}
                helperText={`Currently mentoring ${profile.capacity?.current_mentees || 0} active mentees`}
              />
            </Grid>

            {/* Pricing Model & Rate */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="pricing-model-label">Pricing Offering</InputLabel>
                <Select
                  labelId="pricing-model-label"
                  label="Pricing Offering"
                  value={pricingModel}
                  onChange={(e) => setPricingModel(e.target.value as any)}
                >
                  <MenuItem value="free">Free Mentorship</MenuItem>
                  <MenuItem value="pro_bono">Pro-Bono / Non-Profit</MenuItem>
                  <MenuItem value="paid">Paid Mentorship Rate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {pricingModel === 'paid' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hourly / Session Rate ($)"
                  type="number"
                  fullWidth
                  size="small"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </Grid>
            )}

            {/* Bio */}
            <Grid item xs={12}>
              <TextField
                label="Bio & Mentorship Philosophy"
                multiline
                rows={4}
                fullWidth
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your experience, what mentees can expect, and your mentoring style..."
              />
            </Grid>

            {/* Core Topics */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Mentorship Topics Offered
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="Add a topic (e.g. Career Transition)"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                  sx={{ flexGrow: 1 }}
                />
                <Button variant="outlined" size="small" onClick={handleAddTopic} startIcon={<AddIcon />}>
                  Add
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                {topics.map((tp) => (
                  <Chip key={tp} label={tp} onDelete={() => handleRemoveTopic(tp)} color="primary" variant="filled" />
                ))}
              </Stack>
            </Grid>

            {/* Skills */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Skills & Technical Expertise
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="Add a skill (e.g. Go, PyTorch)"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  sx={{ flexGrow: 1 }}
                />
                <Button variant="outlined" size="small" onClick={handleAddSkill} startIcon={<AddIcon />}>
                  Add
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                {skills.map((sk) => (
                  <Chip key={sk} label={sk} onDelete={() => handleRemoveSkill(sk)} variant="outlined" />
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: '12px',
                fontWeight: 600,
                px: 4,
                py: 1,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              }}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default MentorProfileEditor;
