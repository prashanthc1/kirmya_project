'use client';

import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Stack, Chip, Button, Collapse, IconButton } from '@mui/material';
import { surfaceTransition } from '../../theme/motion';
import { ExpandMore, ExpandLess, CheckCircle, Edit, PlayArrow } from '@mui/icons-material';
import { InterviewQuestion } from '@/features/interview-prep/types';
import { STARAnswerBuilder } from './STARAnswerBuilder';

interface QuestionCardProps {
  question: InterviewQuestion;
  onUpdatePractice?: (id: string, userAnswer: string, star: { s: string; t: string; a: string; r: string }) => Promise<void>;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onUpdatePractice }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34D399' };
      case 'advanced':
      case 'expert': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#F87171' };
      case 'intermediate':
      default: return { bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' };
    }
  };

  const diffStyle = getDifficultyColor(question.difficulty);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3.5,
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: question.is_practiced ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
        color: '#fff',
        transition: surfaceTransition(0.2),
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip label={question.category} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', fontWeight: 600 }} />
              <Chip label={question.difficulty} size="small" sx={{ bgcolor: diffStyle.bg, color: diffStyle.color, fontWeight: 600 }} />
              {question.is_practiced && (
                <Chip icon={<CheckCircle sx={{ color: '#34D399 !important', fontSize: '0.9rem' }} />} label="Practiced" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontWeight: 600 }} />
              )}
            </Stack>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#F8FAFC', mb: 1 }}>
              {question.question}
            </Typography>
          </Box>

          <IconButton onClick={() => setExpanded(!expanded)} sx={{ color: '#94A3B8' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Stack>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box pt={2} borderTop="1px solid rgba(255, 255, 255, 0.06)">
            {isEditing ? (
              <STARAnswerBuilder
                initialAnswer={question.user_answer}
                initialS={question.star_situation}
                initialT={question.star_task}
                initialA={question.star_action}
                initialR={question.star_result}
                onSave={async (userAns, star) => {
                  if (onUpdatePractice) {
                    await onUpdatePractice(question.id, userAns, star);
                  }
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <Stack spacing={2}>
                {question.sample_answer && (
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#60A5FA', display: 'block', mb: 0.5 }}>
                      SAMPLE AI ANSWER / STAR GUIDE
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#CBD5E1', whiteSpace: 'pre-line' }}>
                      {question.sample_answer}
                    </Typography>
                  </Box>
                )}

                {question.user_answer ? (
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#34D399' }}>
                        YOUR PRACTICED RESPONSE
                      </Typography>
                      <Button size="small" startIcon={<Edit />} onClick={() => setIsEditing(true)} sx={{ color: '#94A3B8', textTransform: 'none' }}>
                        Edit Response
                      </Button>
                    </Stack>
                    <Typography variant="body2" sx={{ color: '#F8FAFC' }}>
                      {question.user_answer}
                    </Typography>

                    {(question.star_situation || question.star_result) && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mt={1.5}>
                        {question.star_situation && <Chip label={`S: ${question.star_situation}`} size="small" variant="outlined" sx={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)' }} />}
                        {question.star_task && <Chip label={`T: ${question.star_task}`} size="small" variant="outlined" sx={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)' }} />}
                        {question.star_action && <Chip label={`A: ${question.star_action}`} size="small" variant="outlined" sx={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)' }} />}
                        {question.star_result && <Chip label={`R: ${question.star_result}`} size="small" variant="outlined" sx={{ color: '#34D399', borderColor: 'rgba(52, 211, 153, 0.3)' }} />}
                      </Stack>
                    )}
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditing(true)}
                    sx={{
                      borderColor: 'rgba(96, 165, 250, 0.4)',
                      color: '#60A5FA',
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1,
                    }}
                  >
                    Draft Response with STAR Framework
                  </Button>
                )}
              </Stack>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
