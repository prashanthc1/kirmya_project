'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  useTheme,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export interface CustomQuestion {
  id: string;
  questionText: string;
  questionType: 'Text' | 'LongText' | 'SingleChoice' | 'MultipleChoice' | 'YesNo' | 'Number' | 'Date' | 'FileUpload';
  options: string[];
  isRequired: boolean;
}

interface Props {
  questions: CustomQuestion[];
  onChange: (questions: CustomQuestion[]) => void;
}

const questionTypes = [
  { value: 'Text', label: 'Short Text' },
  { value: 'LongText', label: 'Long Paragraph' },
  { value: 'SingleChoice', label: 'Single Choice (Radio)' },
  { value: 'MultipleChoice', label: 'Multiple Choice (Checkboxes)' },
  { value: 'YesNo', label: 'Yes / No' },
  { value: 'Number', label: 'Numerical Value' },
  { value: 'Date', label: 'Date Picker' },
  { value: 'FileUpload', label: 'File / Portfolio Upload' },
];

export const JobApplicationQuestions: React.FC<Props> = ({ questions, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const addQuestion = () => {
    const newQ: CustomQuestion = {
      id: `q_${Date.now()}`,
      questionText: '',
      questionType: 'Text',
      options: ['Option 1', 'Option 2'],
      isRequired: true,
    };
    onChange([...questions, newQ]);
  };

  const updateQuestion = (index: number, field: keyof CustomQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push(`Option ${updated[qIndex].options.length + 1}`);
    onChange(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    onChange(updated);
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
    onChange(updated);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineIcon /> Custom Application Screening Questions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Collect specific details, portfolio links, or work eligibility answers from applicants.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addQuestion}
          sx={{ borderRadius: '10px', fontWeight: 800 }}
        >
          Add Screening Question
        </Button>
      </Box>

      {questions.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center', borderRadius: '16px', borderStyle: 'dashed', bgcolor: 'transparent' }}>
          <Typography variant="body2" color="text.secondary">
            No custom application questions added yet. Click &quot;Add Screening Question&quot; above.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {questions.map((q, idx) => (
            <Card
              key={q.id}
              sx={{
                borderRadius: '16px',
                p: 2.5,
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth
                    label={`Question #${idx + 1}`}
                    placeholder="e.g. Do you require visa sponsorship in the UAE?"
                    value={q.questionText}
                    onChange={(e) => updateQuestion(idx, 'questionText', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    select
                    label="Question Type"
                    value={q.questionType}
                    onChange={(e) => updateQuestion(idx, 'questionType', e.target.value)}
                  >
                    {questionTypes.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={q.isRequired}
                        onChange={(e) => updateQuestion(idx, 'isRequired', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Required"
                  />
                </Grid>
                <Grid item xs={6} sm={0.5} sx={{ textAlign: 'right' }}>
                  <IconButton color="error" onClick={() => removeQuestion(idx)}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>

              {(q.questionType === 'SingleChoice' || q.questionType === 'MultipleChoice') && (
                <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid rgba(99, 102, 241, 0.4)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                    Choice Options:
                  </Typography>
                  <Stack spacing={1}>
                    {q.options.map((opt, optIdx) => (
                      <Stack key={optIdx} direction="row" spacing={1} alignItems="center">
                        <TextField
                          size="small"
                          value={opt}
                          onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                          sx={{ maxWidth: 300 }}
                        />
                        <IconButton size="small" color="error" onClick={() => removeOption(idx, optIdx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={() => addOption(idx)} sx={{ width: 'fit-content' }}>
                      Add Choice Option
                    </Button>
                  </Stack>
                </Box>
              )}
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default JobApplicationQuestions;
