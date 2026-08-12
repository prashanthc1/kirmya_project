'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Chip,
  Stack,
  MenuItem,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';
import { SkillItem } from '../../features/onboarding/types';

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

const POPULAR_SKILLS = [
  'Vendor Management',
  'HSE Compliance',
  'Building Maintenance',
  'Contract Negotiation',
  'React',
  'Golang',
  'PostgreSQL',
  'Docker',
  'Project Management',
  'Budgeting',
];

const AI_RECOMMENDED = ['SLA Auditing', 'Facility Automation', 'Distributed Systems', 'Kubernetes'];

export const SkillsStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [skills, setSkills] = useState<SkillItem[]>([
    { name: 'Vendor Management', proficiencyLevel: 'Expert' },
    { name: 'Building Maintenance', proficiencyLevel: 'Advanced' },
    { name: 'Contract Negotiation', proficiencyLevel: 'Advanced' },
  ]);

  const [inputSkill, setInputSkill] = useState('');

  const handleAddSkill = (nameToAdd: string) => {
    if (!nameToAdd.trim()) return;
    const exists = skills.some((s) => s.name.toLowerCase() === nameToAdd.toLowerCase());
    if (!exists) {
      setSkills([...skills, { name: nameToAdd.trim(), proficiencyLevel: 'Intermediate' }]);
    }
    setInputSkill('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleProficiencyChange = (index: number, level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') => {
    const updated = [...skills];
    updated[index].proficiencyLevel = level;
    setSkills(updated);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Skills & Proficiencies
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Add your core technical and management skills to power AI job matching.
        </Typography>

        {/* Input & Search */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
          <TextField
            placeholder="Search or add a skill (e.g. Facilities Management)..."
            fullWidth
            value={inputSkill}
            onChange={(e) => setInputSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill(inputSkill);
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleAddSkill(inputSkill)}
            sx={{ px: 3, borderRadius: '12px', fontWeight: 700 }}
          >
            Add
          </Button>
        </Stack>

        {/* AI Recommendations */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <AutoAwesomeIcon fontSize="small" /> AI RECOMMENDED FOR YOUR ROLE:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {AI_RECOMMENDED.map((sk) => (
              <Chip
                key={sk}
                label={`+ ${sk}`}
                size="small"
                onClick={() => handleAddSkill(sk)}
                sx={{
                  bgcolor: 'rgba(168, 85, 247, 0.15)',
                  color: '#a855f7',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Popular Skills */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
            Popular Skills:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {POPULAR_SKILLS.map((sk) => (
              <Chip
                key={sk}
                label={`+ ${sk}`}
                size="small"
                variant="outlined"
                onClick={() => handleAddSkill(sk)}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Selected Skills List */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
          Your Selected Skills ({skills.length})
        </Typography>

        <Stack spacing={1.5} sx={{ mb: 4 }}>
          {skills.map((skill, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {skill.name}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  select
                  size="small"
                  value={skill.proficiencyLevel}
                  onChange={(e) => handleProficiencyChange(idx, e.target.value as any)}
                  sx={{ minWidth: 140 }}
                >
                  {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </TextField>

                <IconButton onClick={() => handleRemoveSkill(idx)} color="error" size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => onNext({ skills })}
            endIcon={<ArrowForwardIcon />}
            sx={{ py: 1.2, px: 3.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Continue
          </Button>
        </Stack>
      </GlassCard>
    </motion.div>
  );
};

export default SkillsStep;
