import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  LinearProgress,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/Timer';
import QuizIcon from '@mui/icons-material/Quiz';
import CodeIcon from '@mui/icons-material/Code';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Assessment, UserAnswerSubmission, SubmitTestPayload } from '../types';

interface TestRunnerModalProps {
  open: boolean;
  assessment: Assessment;
  onClose: () => void;
  onSubmit: (payload: SubmitTestPayload) => Promise<void>;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({
  open,
  assessment,
  onClose,
  onSubmit,
}) => {
  const questions = assessment.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // User answers map: question_id -> { selected_option, practical_response }
  const [answers, setAnswers] = useState<Record<string, UserAnswerSubmission>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState((assessment.duration_minutes || 25) * 60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (qId: string, optionIdx: number) => {
    setAnswers({
      ...answers,
      [qId]: {
        question_id: qId,
        selected_option: optionIdx,
      },
    });
  };

  const handleTextResponse = (qId: string, text: string) => {
    setAnswers({
      ...answers,
      [qId]: {
        question_id: qId,
        practical_response: text,
      },
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const answerList: UserAnswerSubmission[] = Object.values(answers);
      const totalDuration = (assessment.duration_minutes || 25) * 60;
      const timeTaken = totalDuration - timeLeftSeconds;

      await onSubmit({
        time_taken_seconds: timeTaken > 0 ? timeTaken : 300,
        answers: answerList,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timerFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (!currentQ) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Test Header */}
      <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuizIcon sx={{ color: '#38bdf8' }} />
          <Typography variant="h6" fontWeight="bold">{assessment.title}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<TimerIcon sx={{ color: '#f59e0b !important' }} />}
            label={timerFormatted}
            sx={{ bgcolor: '#0f172a', color: '#f59e0b', fontWeight: 'bold', border: '1px solid #f59e0b', fontSize: '0.9rem' }}
          />
          <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Question {currentIndex + 1} of {questions.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
              {currentQ.question_type === 'mcq' ? 'Multiple Choice Test Item' : 'Practical Hands-on Scenario'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((currentIndex + 1) * 100) / questions.length}
            sx={{ height: 8, borderRadius: 4, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }}
          />
        </Box>

        {/* Question Prompt */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
            {currentQ.question_type === 'mcq' ? (
              <QuizIcon sx={{ color: '#38bdf8', mt: 0.5 }} />
            ) : (
              <CodeIcon sx={{ color: '#10b981', mt: 0.5 }} />
            )}
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', lineHeight: 1.4 }}>
              {currentQ.question_text}
            </Typography>
          </Box>

          {/* MCQ Option Selection */}
          {currentQ.question_type === 'mcq' && (
            <RadioGroup
              value={answers[currentQ.id]?.selected_option ?? ''}
              onChange={(e) => handleSelectOption(currentQ.id, parseInt(e.target.value))}
            >
              {currentQ.options?.map((opt, optIdx) => (
                <Paper
                  key={optIdx}
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    bgcolor: answers[currentQ.id]?.selected_option === optIdx ? '#0f172a' : '#1e293b',
                    border: answers[currentQ.id]?.selected_option === optIdx ? '2px solid #38bdf8' : '1px solid #334155',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#0f172a' },
                  }}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                >
                  <FormControlLabel
                    value={optIdx}
                    control={<Radio sx={{ color: '#38bdf8', '&.Mui-checked': { color: '#38bdf8' } }} />}
                    label={<Typography sx={{ color: '#e2e8f0' }}>{opt}</Typography>}
                  />
                </Paper>
              ))}
            </RadioGroup>
          )}

          {/* Practical Response Box */}
          {currentQ.question_type === 'practical' && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>AI Evaluated Practical Item:</strong> Provide your architectural design, Go/React code solution, or step-by-step strategy. The AI Engine will evaluate completeness, error handling, and modularity against industry standards.
              </Alert>

              <TextField
                multiline
                rows={7}
                fullWidth
                placeholder="Write your code solution, architectural blueprint, or strategy here..."
                value={answers[currentQ.id]?.practical_response || ''}
                onChange={(e) => handleTextResponse(currentQ.id, e.target.value)}
                sx={{
                  textarea: { color: '#f8fafc', fontFamily: 'monospace' },
                  bgcolor: '#0f172a',
                  '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } },
                }}
              />
            </Box>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#1e293b', justifyContent: 'space-between' }}>
        <Button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          startIcon={<ArrowBackIcon />}
          sx={{ color: '#94a3b8' }}
        >
          Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            endIcon={<ArrowForwardIcon />}
            sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
          >
            Next Question
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ bgcolor: '#10b981', color: '#fff', fontWeight: 'bold', '&:hover': { bgcolor: '#059669' } }}
          >
            {submitting ? 'Evaluating Test & AI Scoring...' : 'Submit Assessment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
export default TestRunnerModal;
