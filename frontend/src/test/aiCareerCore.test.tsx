import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AIJobMatchCard } from '../components/ai/AIJobMatchCard';
import { ResumeAnalysisView } from '../components/ai/ResumeAnalysisView';
import { SkillGapBridge } from '../components/ai/SkillGapBridge';
import { AICoachChat } from '../components/ai/AICoachChat';
import { AIJobMatch } from '../features/ai_job_match/types';
import { ResumeAnalysis } from '../features/resume_analysis/types';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#38bdf8' },
    success: { main: '#22c55e' },
  },
});

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('AI Career Intelligence Components', () => {
  it('renders AIJobMatchCard with match score and explanation', () => {
    const mockMatch: AIJobMatch = {
      id: 'match-101',
      user_id: 'user-101',
      job_id: 'job-101',
      job_title: 'Staff Backend Architect',
      company_name: 'Acme Cloud',
      overall_score: 92,
      match_tier: 'strong_match',
      explanation: 'Exceptional alignment with Go and distributed systems.',
      matched_skills: ['Go', 'PostgreSQL', 'Docker'],
      missing_skills: ['Kubernetes'],
      recommended_actions: [
        {
          type: 'course',
          title: 'Master Kubernetes Orchestration',
          description: '3-hour course to bridge requirement gap.',
          action_url: '/learning/k8s',
        },
      ],
      created_at: new Date().toISOString(),
    };

    const handleApply = vi.fn();
    renderWithTheme(<AIJobMatchCard match={mockMatch} onApply={handleApply} />);

    expect(screen.getByText('Staff Backend Architect')).toBeDefined();
    expect(screen.getByText('Acme Cloud')).toBeDefined();
    expect(screen.getByText('92%')).toBeDefined();
    expect(screen.getByText('Exceptional alignment with Go and distributed systems.')).toBeDefined();
    expect(screen.getByText('Go')).toBeDefined();
    expect(screen.getByText('Kubernetes')).toBeDefined();

    const applyBtn = screen.getByText('Apply Now');
    fireEvent.click(applyBtn);
    expect(handleApply).toHaveBeenCalledWith('job-101');
  });

  it('renders ResumeAnalysisView with ATS compatibility and metrics', () => {
    const mockAnalysis: ResumeAnalysis = {
      id: 'analysis-1',
      user_id: 'user-1',
      target_job_title: 'Senior Go Engineer',
      target_job_description: 'Building microservices in Go with Postgres',
      resume_text: 'Experienced engineer with backend skills',
      status: 'completed',
      created_at: new Date().toISOString(),
      scores: {
        id: 'score-1',
        analysis_id: 'analysis-1',
        overall_score: 88,
        ats_compatibility_score: 91,
        structure_score: 85,
        skills_score: 90,
        experience_score: 86,
        job_match_score: 89,
        created_at: new Date().toISOString(),
      },
      improvements: {
        id: 'hist-1',
        analysis_id: 'analysis-1',
        user_id: 'user-1',
        missing_skills: ['gRPC'],
        present_keywords: ['GO', 'POSTGRESQL'],
        missing_keywords: ['GRPC'],
        keyword_density_score: 84,
        structure_feedback: ['Section headers present.'],
        experience_bullet_fixes: ['Add metrics to database performance.'],
        general_suggestions: ['Export as single column PDF.'],
        created_at: new Date().toISOString(),
      },
    };

    renderWithTheme(<ResumeAnalysisView analysis={mockAnalysis} />);

    expect(screen.getByText('88')).toBeDefined();
    expect(screen.getByText('91%')).toBeDefined();
    expect(screen.getByText('GO')).toBeDefined();
    expect(screen.getByText('+ GRPC')).toBeDefined();
    expect(screen.getByText('Add metrics to database performance.')).toBeDefined();
  });

  it('renders SkillGapBridge with matched and gap skills', () => {
    const handleCourseClick = vi.fn();
    renderWithTheme(
      <SkillGapBridge
        targetRole="Cloud Platform Engineer"
        matchedSkills={['Go', 'Linux']}
        missingSkills={['Terraform', 'Vault']}
        transferableSkills={['CI/CD']}
        actionItems={['Complete Vault security module']}
        onCourseClick={handleCourseClick}
      />
    );

    expect(screen.getByText(/Skill Bridge Matrix: Cloud Platform Engineer/)).toBeDefined();
    expect(screen.getByText('Go')).toBeDefined();
    expect(screen.getByText('+ Terraform')).toBeDefined();
    expect(screen.getByText('CI/CD')).toBeDefined();
    expect(screen.getByText('Complete Vault security module')).toBeDefined();

    const tfChip = screen.getByText('+ Terraform');
    fireEvent.click(tfChip);
    expect(handleCourseClick).toHaveBeenCalledWith('Terraform');
  });

  it('renders AICoachChat and sends user message', async () => {
    const mockMessages = [
      { id: '1', sender: 'assistant' as const, content: 'Hello! How can I help with your interview prep?' },
    ];

    const handleSend = vi.fn().mockResolvedValue(undefined);
    renderWithTheme(<AICoachChat messages={mockMessages} onSendMessage={handleSend} />);

    expect(screen.getByText('Hello! How can I help with your interview prep?')).toBeDefined();

    const input = screen.getByPlaceholderText('Type your message or STAR interview answer...');
    fireEvent.change(input, { target: { value: 'Here is my STAR response' } });

    const sendBtn = screen.getByText('Send');
    fireEvent.click(sendBtn);

    expect(handleSend).toHaveBeenCalledWith('Here is my STAR response');
  });
});
