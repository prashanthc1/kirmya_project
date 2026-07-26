import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Rating,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { CourseCategory, SkillAssessment } from '../types';

interface SkillAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitAssessment: (domain: CourseCategory, answers: Record<string, number>) => Promise<SkillAssessment>;
}

export const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({
  open,
  onClose,
  onSubmitAssessment,
}) => {
  const [domain, setDomain] = useState<CourseCategory>('Technology');
  const [answers, setAnswers] = useState<Record<string, number>>({
    q1: 4,
    q2: 3,
    q3: 4,
    q4: 3,
    q5: 5,
  });

  const [result, setResult] = useState<SkillAssessment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const questions: Record<CourseCategory, Array<{ id: string; question: string }>> = {
    Technology: [
      { id: 'q1', question: 'How confident are you with full-stack API architecture and database design?' },
      { id: 'q2', question: 'Rate your proficiency in React, TypeScript, and modern frontend state management.' },
      { id: 'q3', question: 'How experienced are you with cloud deployments (Docker, AWS, GCP, CI/CD pipelines)?' },
      { id: 'q4', question: 'How comfortable are you solving data structure and algorithm challenges under timed conditions?' },
      { id: 'q5', question: 'Rate your familiarity with microservices architecture and caching strategies.' },
    ],
    Management: [
      { id: 'q1', question: 'How experienced are you leading Agile/Scrum teams and managing sprint backlogs?' },
      { id: 'q2', question: 'Rate your ability to align cross-functional teams around product vision and KPIs.' },
      { id: 'q3', question: 'How comfortable are you conducting one-on-one performance reviews and mentoring staff?' },
      { id: 'q4', question: 'Rate your proficiency in project risk management and resource allocation.' },
      { id: 'q5', question: 'How effective are you in managing executive stakeholders and customer expectations?' },
    ],
    'Soft skills': [
      { id: 'q1', question: 'How effective are you at communicating complex technical ideas to non-technical stakeholders?' },
      { id: 'q2', question: 'Rate your emotional intelligence and ability to handle high-pressure workplace conflict.' },
      { id: 'q3', question: 'How confident are you presenting strategic proposals to leadership teams?' },
      { id: 'q4', question: 'Rate your adaptability when business priorities abruptly change.' },
      { id: 'q5', question: 'How strong are your negotiation and persuasion skills during team decision making?' },
    ],
    'Interview preparation': [
      { id: 'q1', question: 'How well can you structure behavioral answers using the STAR method?' },
      { id: 'q2', question: 'Rate your ability to design scalable systems on a whiteboard during live technical interviews.' },
      { id: 'q3', question: 'How confident are you answering live coding algorithms while communicating out loud?' },
      { id: 'q4', question: 'Rate your readiness to negotiate compensation packages and job offers.' },
      { id: 'q5', question: 'How prepared are you for executive-level culture fit and leadership bar-raiser interviews?' },
    ],
    'Industry certifications': [
      { id: 'q1', question: 'How prepared are you for AWS Solutions Architect or Cloud Developer examinations?' },
      { id: 'q2', question: 'Rate your knowledge of cloud security, IAM policies, and infrastructure as code.' },
      { id: 'q3', question: 'How experienced are you with Kubernetes administration and container orchestration?' },
      { id: 'q4', question: 'Rate your familiarity with PMP, Certified ScrumMaster, or ITIL frameworks.' },
      { id: 'q5', question: 'How well do you perform on timed mock certification practice tests?' },
    ],
  };

  const handleRatingChange = (qId: string, value: number) => {
    setAnswers({ ...answers, [qId]: value });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await onSubmitAssessment(domain, answers);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon sx={{ color: '#38bdf8' }} />
          <Typography variant="h6" fontWeight="bold">Job-Readiness Skill Assessment</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
        {!result ? (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
              Select Skill Assessment Domain
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {(['Technology', 'Management', 'Soft skills', 'Interview preparation', 'Industry certifications'] as CourseCategory[]).map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  clickable
                  onClick={() => setDomain(cat)}
                  sx={{
                    bgcolor: domain === cat ? '#38bdf8' : '#1e293b',
                    color: domain === cat ? '#0f172a' : '#94a3b8',
                    fontWeight: 'bold',
                    border: '1px solid #334155',
                  }}
                />
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2 }}>
              Evaluate your current proficiency level (1 = Novice, 5 = Expert) to generate your job-readiness score and tailored learning path.
            </Typography>

            {questions[domain].map((q, idx) => (
              <Paper key={q.id} sx={{ p: 2, mb: 2, bgcolor: '#1e293b', border: '1px solid #334155' }}>
                <Typography variant="body1" fontWeight="bold" sx={{ color: '#e2e8f0', mb: 1 }}>
                  {idx + 1}. {q.question}
                </Typography>
                <Rating
                  value={answers[q.id] || 3}
                  onChange={(_, val) => val && handleRatingChange(q.id, val)}
                  precision={1}
                />
              </Paper>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <EmojiEventsIcon sx={{ fontSize: 60, color: '#f59e0b', mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
              Skill Evaluation Complete!
            </Typography>

            <Paper sx={{ p: 3, my: 2, bgcolor: '#1e293b', border: '1px solid #334155', display: 'inline-block', width: '100%' }}>
              <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>Domain Assessed: {result.domain}</Typography>

              <Typography variant="h2" fontWeight="bold" sx={{ color: '#38bdf8', my: 1 }}>
                {result.score}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={result.score}
                sx={{ height: 10, borderRadius: 5, bgcolor: '#0f172a', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' }, mb: 2 }}
              />

              <Chip
                icon={<CheckCircleOutlineIcon sx={{ color: '#fff !important' }} />}
                label={`Career Status: ${result.readiness_level}`}
                sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', py: 2, px: 1 }}
              />
            </Paper>

            <Alert severity="info" sx={{ textAlign: 'left', mb: 2 }}>
              Based on your evaluation score of {result.score}%, we have generated a customized <strong>{result.domain} Learning Path</strong> to help you reach top-tier job readiness.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
        {!result ? (
          <>
            <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
            >
              {submitting ? 'Evaluating...' : 'Evaluate Job Readiness'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleReset} sx={{ color: '#94a3b8' }}>Retake Test</Button>
            <Button
              onClick={onClose}
              variant="contained"
              sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
            >
              Explore Recommended Learning Path
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
export default SkillAssessmentModal;
