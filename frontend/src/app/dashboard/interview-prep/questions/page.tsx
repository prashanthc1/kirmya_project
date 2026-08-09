'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Stack, Button, Grid, Paper } from '@mui/material';
import { AutoAwesome, Add } from '@mui/icons-material';
import { InterviewPrepFilterBar } from '@/components/interview-prep/InterviewPrepFilterBar';
import { QuestionCard } from '@/components/interview-prep/QuestionCard';
import { QuestionGeneratorModal } from '@/components/interview-prep/QuestionGeneratorModal';
import { InterviewPrepAPI } from '@/features/interview-prep/api';
import { InterviewQuestion } from '@/features/interview-prep/types';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [difficulty, setDifficulty] = useState('ALL');
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const qList = await InterviewPrepAPI.listQuestions();
      setQuestions(qList);
    } catch (err) {
      console.error('Failed to fetch questions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleGenerate = async (req: any) => {
    await InterviewPrepAPI.generateQuestions(req);
    await fetchQuestions();
  };

  const handleUpdatePractice = async (qId: string, userAns: string, star: { s: string; t: string; a: string; r: string }) => {
    await InterviewPrepAPI.updateQuestionPractice(qId, {
      user_answer: userAns,
      star_situation: star.s,
      star_task: star.t,
      star_action: star.a,
      star_result: star.r,
      is_practiced: true,
    });
    await fetchQuestions();
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = !searchQuery || q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'ALL' || q.category.toLowerCase() === category.toLowerCase();
    const matchesDifficulty = difficulty === 'ALL' || q.difficulty.toLowerCase() === difficulty.toLowerCase();
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: '#F8FAFC' }}>
            Interview Question Bank & STAR Hub
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8' }}>
            Practice questions categorized by behavioral, technical, situational, and leadership dimensions.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AutoAwesome />}
          onClick={() => setGenModalOpen(true)}
          sx={{
            background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2.5,
            px: 3,
          }}
        >
          Generate Questions
        </Button>
      </Stack>

      <InterviewPrepFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={category}
        onCategoryChange={setCategory}
        selectedDifficulty={difficulty}
        onDifficultyChange={setDifficulty}
      />

      <Stack spacing={2}>
        {filteredQuestions.map((q) => (
          <QuestionCard key={q.id} question={q} onUpdatePractice={handleUpdatePractice} />
        ))}

        {filteredQuestions.length === 0 && !loading && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 4,
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px border-dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ color: '#94A3B8' }}>
              No matching questions found in your bank.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setGenModalOpen(true)}
              sx={{ mt: 2, borderColor: 'rgba(96, 165, 250, 0.4)', color: '#60A5FA' }}
            >
              Generate Tailored Questions with AI
            </Button>
          </Paper>
        )}
      </Stack>

      <QuestionGeneratorModal
        open={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        onGenerate={handleGenerate}
      />
    </Container>
  );
}
