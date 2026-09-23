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
      <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuizIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">{assessment.title}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<TimerIcon sx={{ color: 'warning.main' }} />}
            label={timerFormatted}
            sx={{ bgcolor: 'background.default', color: 'warning.main', fontWeight: 'bold', border: 1, borderColor: 'divider', fontSize: '0.9rem' }}
          />
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: 'background.default', color: 'text.primary', p: 3 }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Question {currentIndex + 1} of {questions.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {currentQ.question_type === 'mcq' ? 'Multiple Choice Test Item' : 'Practical Hands-on Scenario'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((currentIndex + 1) * 100) / questions.length}
            sx={{ height: 8, borderRadius: 4, bgcolor: 'background.paper', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
          />
        </Box>

        {/* Question Prompt */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
            {currentQ.question_type === 'mcq' ? (
              <QuizIcon sx={{ color: 'primary.main', mt: 0.5 }} />
            ) : (
              <CodeIcon sx={{ color: 'success.main', mt: 0.5 }} />
            )}
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', lineHeight: 1.4 }}>
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
                    bgcolor: answers[currentQ.id]?.selected_option === optIdx ? "background.default" : "background.paper",
                    border: answers[currentQ.id]?.selected_option === optIdx ? '2px solid #38bdf8' : '1px solid #334155',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'background.default' },
                  }}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                >
                  <FormControlLabel
                    value={optIdx}
                    control={<Radio sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }} />}
                    label={<Typography sx={{ color: 'text.primary' }}>{opt}</Typography>}
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
                  textarea: { color: 'text.primary', fontFamily: 'monospace' },
                  bgcolor: 'background.default',
                  '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } },
                }}
              />
            </Box>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.paper', justifyContent: 'space-between' }}>
        <Button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          startIcon={<ArrowBackIcon />}
          sx={{ color: 'text.secondary' }}
        >
          Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            endIcon={<ArrowForwardIcon />}
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', '&:hover': { bgcolor: 'primary.main' } }}
          >
            Next Question
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold', '&:hover': { bgcolor: 'success.main' } }}
          >
            {submitting ? 'Evaluating Test & AI Scoring...' : 'Submit Assessment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
export default TestRunnerModal;
