import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';

import { resumeApi } from '../features/resume/api';
import { ResumeDashboard } from '../components/resume/ResumeDashboard';
import { ResumeCard } from '../components/resume/ResumeCard';
import { ATSScoreCard } from '../components/resume/ATSScoreCard';
import { ResumePreviewToolbar } from '../components/resume/ResumePreviewToolbar';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard/resumes',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({ id: 'res-1' }),
}));

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getAccessToken: () => 'mock-jwt-token',
}));

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'u1', email: 'candidate@kirmya.com', name: 'Candidate User' },
    notificationsCount: 0,
    setNotificationsCount: vi.fn(),
    authenticated: true,
    isAuthenticated: true,
    loading: false,
    permissions: [],
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Resume, CV & Document Management Experience (Prompt 25/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResumes = [
    {
      id: 'res-101',
      userId: 'u1',
      title: 'Principal Distributed Systems Architect Resume',
      templateName: 'classic',
      isDefault: true,
      atsScore: 92,
      completionPercentage: 100,
      viewCount: 45,
      downloadCount: 12,
      applicationCount: 6,
      fontFamily: 'Inter',
      fontSize: '11pt',
      lineSpacing: '1.2',
      pageMargins: '0.75in',
      paperSize: 'Letter',
      primaryColor: '#6366F1',
      aiSuggestions: '[]',
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-30T10:00:00Z',
      sections: [],
    },
    {
      id: 'res-102',
      userId: 'u1',
      title: 'Staff Fullstack Tech Lead Resume',
      templateName: 'modern',
      isDefault: false,
      atsScore: 84,
      completionPercentage: 90,
      viewCount: 18,
      downloadCount: 4,
      applicationCount: 2,
      fontFamily: 'Inter',
      fontSize: '11pt',
      lineSpacing: '1.2',
      pageMargins: '0.75in',
      paperSize: 'Letter',
      primaryColor: '#06B6D4',
      aiSuggestions: '[]',
      createdAt: '2026-08-22T10:00:00Z',
      updatedAt: '2026-08-28T10:00:00Z',
      sections: [],
    },
  ];

  describe('ResumeDashboard Component', () => {
    it('renders header banner, metrics cards, and resume cards', () => {
      renderWithTheme(
        <ResumeDashboard
          resumes={mockResumes}
          onCreate={vi.fn()}
          onImport={vi.fn()}
          onBrowseTemplates={vi.fn()}
          onEdit={vi.fn()}
          onPreview={vi.fn()}
          onDuplicate={vi.fn()}
          onDownload={vi.fn()}
          onSetDefault={vi.fn()}
          onShare={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Resume Studio & Document Management')).toBeDefined();
      expect(screen.getByText('Total Resumes')).toBeDefined();
      expect(screen.getByText('Principal Distributed Systems Architect Resume')).toBeDefined();
      expect(screen.getByText('Staff Fullstack Tech Lead Resume')).toBeDefined();
    });

    it('renders empty state when no resumes exist', () => {
      renderWithTheme(
        <ResumeDashboard
          resumes={[]}
          onCreate={vi.fn()}
          onImport={vi.fn()}
          onBrowseTemplates={vi.fn()}
          onEdit={vi.fn()}
          onPreview={vi.fn()}
          onDuplicate={vi.fn()}
          onDownload={vi.fn()}
          onSetDefault={vi.fn()}
          onShare={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('No Resumes Created Yet')).toBeDefined();
      expect(screen.getAllByRole('button', { name: /Create Resume/i })[0]).toBeDefined();
    });
  });

  describe('ResumeCard Component', () => {
    it('renders Primary Default chip for default resume and action buttons', () => {
      const mockEdit = vi.fn();
      const mockPreview = vi.fn();
      const mockDownload = vi.fn();

      renderWithTheme(
        <ResumeCard
          resume={mockResumes[0]}
          onEdit={mockEdit}
          onPreview={mockPreview}
          onDuplicate={vi.fn()}
          onDownload={mockDownload}
          onSetDefault={vi.fn()}
          onShare={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Principal Distributed Systems Architect Resume')).toBeDefined();
      expect(screen.getByText('Primary Default')).toBeDefined();
      expect(screen.getByText('ATS Score: 92%')).toBeDefined();

      const editBtn = screen.getByRole('button', { name: /Edit Resume/i });
      fireEvent.click(editBtn);
      expect(mockEdit).toHaveBeenCalledWith(mockResumes[0]);

      const previewBtn = screen.getByRole('button', { name: /Preview/i });
      fireEvent.click(previewBtn);
      expect(mockPreview).toHaveBeenCalledWith(mockResumes[0]);
    });
  });

  describe('ATSScoreCard Component', () => {
    it('renders score metric and description', () => {
      renderWithTheme(<ATSScoreCard score={92} />);

      expect(screen.getByText('ATS Optimization Score')).toBeDefined();
      expect(screen.getByText(/92 \/ 100/i)).toBeDefined();
    });
  });

  describe('ResumePreviewToolbar Component', () => {
    it('renders zoom controls and download action', () => {
      const mockZoomIn = vi.fn();
      const mockZoomOut = vi.fn();
      const mockDownload = vi.fn();

      renderWithTheme(
        <ResumePreviewToolbar
          zoom={1.0}
          onZoomIn={mockZoomIn}
          onZoomOut={mockZoomOut}
          deviceView="desktop"
          onDeviceChange={vi.fn()}
          templateName="classic"
          onTemplateChange={vi.fn()}
          onDownload={mockDownload}
          onPrint={vi.fn()}
        />
      );

      const zoomInBtn = screen.getByRole('button', { name: /Zoom in/i });
      fireEvent.click(zoomInBtn);
      expect(mockZoomIn).toHaveBeenCalledTimes(1);

      const downloadBtn = screen.getByRole('button', { name: /Download PDF/i });
      fireEvent.click(downloadBtn);
      expect(mockDownload).toHaveBeenCalledTimes(1);
    });
  });

  describe('resumeApi Service', () => {
    it('getResumes calls GET /resumes', async () => {
      (authApiClient.get as any).mockResolvedValueOnce({ data: mockResumes });

      const res = await resumeApi.getResumes();
      expect(authApiClient.get).toHaveBeenCalledWith('/resumes');
      expect(res.length).toBe(2);
    });

    it('getResume calls GET /resumes/:id', async () => {
      (authApiClient.get as any).mockResolvedValueOnce({ data: mockResumes[0] });

      const res = await resumeApi.getResume('res-101');
      expect(authApiClient.get).toHaveBeenCalledWith('/resumes/res-101');
      expect(res.title).toBe('Principal Distributed Systems Architect Resume');
    });

    it('createResume calls POST /resumes with payload', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({ data: mockResumes[0] });

      const res = await resumeApi.createResume({ title: 'New Resume', templateName: 'modern' });
      expect(authApiClient.post).toHaveBeenCalledWith('/resumes', {
        title: 'New Resume',
        templateName: 'modern',
      });
      expect(res.id).toBe('res-101');
    });

    it('setDefaultResume calls POST /resumes/:id/default', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({ data: {} });

      await resumeApi.setDefaultResume('res-101');
      expect(authApiClient.post).toHaveBeenCalledWith('/resumes/res-101/default');
    });

    it('deleteResume calls DELETE /resumes/:id', async () => {
      (authApiClient.delete as any).mockResolvedValueOnce({ data: {} });

      await resumeApi.deleteResume('res-101');
      expect(authApiClient.delete).toHaveBeenCalledWith('/resumes/res-101');
    });
  });
});
