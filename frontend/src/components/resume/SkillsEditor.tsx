'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Chip, Stack, Select, MenuItem, FormControl, InputLabel, Paper, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { SkillItem } from '@/features/resume/types';

interface SkillsEditorProps {
  skills: SkillItem[];
  onChange: (items: SkillItem[]) => void;
}

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, onChange }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technical');
  const [proficiency, setProficiency] = useState('Expert');

  const handleAddSkill = () => {
    if (!name.trim()) return;
    onChange([...skills, { name: name.trim(), category, proficiency }]);
    setName('');
  };

  const handleRemoveSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Skills & Industry Expertise
      </Typography>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField fullWidth size="small" label="Skill Name (e.g. Golang, React, Docker)" value={name} onChange={(e) => setName(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="Technical">Technical</MenuItem>
                <MenuItem value="Soft Skills">Soft Skills</MenuItem>
                <MenuItem value="Management">Management</MenuItem>
                <MenuItem value="Industry Skills">Industry Skills</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Level</InputLabel>
              <Select value={proficiency} label="Level" onChange={(e) => setProficiency(e.target.value)}>
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
                <MenuItem value="Expert">Expert</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1.5}>
            <Button fullWidth variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddSkill} sx={{ height: 40, textTransform: 'none', fontWeight: 700 }}>
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {skills.map((sk, idx) => (
          <Chip
            key={idx}
            label={`${sk.name} (${sk.proficiency})`}
            onDelete={() => handleRemoveSkill(idx)}
            sx={{
              bgcolor: 'rgba(0, 102, 255, 0.1)',
              color: '#0066FF',
              fontWeight: 700,
              border: '1px solid rgba(0, 102, 255, 0.3)',
              py: 2,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
