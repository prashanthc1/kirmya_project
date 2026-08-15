import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Avatar,
  Chip,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { MentorProfile, MentorshipFormat, MentorshipRequest } from '../../features/mentorship/types';

interface MentorshipRequestModalProps {
  open: boolean;
  onClose: () => void;
  mentor: MentorProfile | null;
  onSubmit: (requestData: Partial<MentorshipRequest>) => Promise<void>;
}

export const MentorshipRequestModal: React.FC<MentorshipRequestModalProps> = ({
  open,
  onClose,
  mentor,
  onSubmit,
}) => {
  const [note, setNote] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<MentorshipFormat>('one_on_one');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [preferredTimes, setPreferredTimes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mentor) return null;

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please provide a brief intro or goal description for your mentor.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        mentor_id: mentor.id,
        note: note.trim(),
        format: selectedFormat,
        requested_topics: selectedTopics.length > 0 ? selectedTopics : mentor.topics.slice(0, 2),
        preferred_times: preferredTimes ? [preferredTimes] : ['Flexible schedule'],
      });
      setNote('');
      setSelectedTopics([]);
      setPreferredTimes('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(255, 255, 255, 0.8)'
              : '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          Request Mentorship
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, pt: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          {/* Mentor Summary */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: '16px',
              bgcolor: (theme) =>
                theme.palette.mode === 'light'
                  ? 'rgba(99, 102, 241, 0.06)'
                  : 'rgba(129, 140, 248, 0.1)',
              mb: 3,
            }}
          >
            <Avatar src={mentor.avatar} alt={mentor.name} sx={{ width: 52, height: 52 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {mentor.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mentor.title} at {mentor.company}
              </Typography>
            </Box>
          </Box>

          {/* Topics selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              What would you like assistance with?
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1, mt: 1 }}>
              {mentor.topics.map((topic) => {
                const selected = selectedTopics.includes(topic);
                return (
                  <Chip
                    key={topic}
                    label={topic}
                    clickable
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => toggleTopic(topic)}
                    sx={{ borderRadius: '10px', fontWeight: 600 }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Format selection */}
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary', mb: 1 }}>
              Preferred Mentorship Format
            </FormLabel>
            <RadioGroup
              row
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as MentorshipFormat)}
            >
              <FormControlLabel value="one_on_one" control={<Radio size="small" />} label="1-on-1 Sessions" />
              <FormControlLabel value="async" control={<Radio size="small" />} label="Async Guidance" />
              <FormControlLabel value="code_review" control={<Radio size="small" />} label="Code Review" />
            </RadioGroup>
          </FormControl>

          {/* Note / Intro */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Introduction & Primary Goals
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="Introduce yourself, your current experience level, and what specific outcomes you hope to achieve through this mentorship..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                },
              }}
            />
          </Box>

          {/* Preferred timing */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Preferred Days / Time Window (Optional)
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Weekday evenings, Tuesday 4 PM PST"
              value={preferredTimes}
              onChange={(e) => setPreferredTimes(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '12px', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={<SendIcon />}
            sx={{
              borderRadius: '12px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              px: 3,
            }}
          >
            {submitting ? 'Submitting...' : 'Send Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MentorshipRequestModal;
