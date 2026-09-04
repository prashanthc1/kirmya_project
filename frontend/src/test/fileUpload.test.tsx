import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { FileUploadZone } from '../components/upload/FileUploadZone';
import { AvatarUploader } from '../components/upload/AvatarUploader';
import { DocumentUploader } from '../components/upload/DocumentUploader';
import { mediaApi } from '../features/media/api';

vi.mock('../features/media/api', () => ({
  mediaApi: {
    uploadFile: vi.fn(),
    getFileMetadata: vi.fn(),
    getSignedURL: vi.fn(),
    deleteFile: vi.fn(),
    presignUpload: vi.fn(),
    getViewURL: vi.fn((id: string) => `http://localhost:8080/api/v1/files/${id}/view`),
    getDownloadURL: vi.fn((id: string) => `http://localhost:8080/api/v1/files/${id}/download`),
  },
}));

const renderWithTheme = (ui: React.ReactElement) => {
  const theme = getTheme('dark');
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('File & Media Upload Components Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FileUploadZone with custom label and helper text', () => {
    renderWithTheme(
      <FileUploadZone
        label="Upload Job Contract"
        helperText="Drag contract PDF here"
        allowedExtensions={['.pdf']}
      />
    );

    expect(screen.getByText('Upload Job Contract')).toBeInTheDocument();
    expect(screen.getByText('Drag contract PDF here')).toBeInTheDocument();
    expect(screen.getByText(/Supported: .pdf/i)).toBeInTheDocument();
  });

  it('handles valid file upload successfully in FileUploadZone', async () => {
    const mockFileRecord = {
      id: 'f1111111-1111-1111-1111-111111111111',
      owner_id: 'u1111111-1111-1111-1111-111111111111',
      original_filename: 'contract.pdf',
      storage_key: 'general/u1/f1.pdf',
      media_type: 'document' as const,
      detected_content_type: 'application/pdf',
      file_size: 2048,
      checksum: 'sha256hash',
      extension: '.pdf',
      category: 'general' as const,
      visibility: 'private' as const,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    (mediaApi.uploadFile as any).mockResolvedValue(mockFileRecord);
    const onUploaded = vi.fn();

    renderWithTheme(
      <FileUploadZone
        label="Upload Document"
        allowedExtensions={['.pdf']}
        onFileUploaded={onUploaded}
      />
    );

    const file = new File(['%PDF-1.5 fake content'], 'contract.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload Document');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mediaApi.uploadFile).toHaveBeenCalled();
      expect(onUploaded).toHaveBeenCalledWith(mockFileRecord);
      expect(screen.getByText('contract.pdf')).toBeInTheDocument();
      expect(screen.getByText(/Uploaded successfully/i)).toBeInTheDocument();
    });
  });

  it('rejects disallowed file extensions on client side', async () => {
    renderWithTheme(
      <FileUploadZone
        label="Upload Resume"
        allowedExtensions={['.pdf', '.docx']}
      />
    );

    const badFile = new File(['bad script'], 'script.exe', { type: 'application/x-msdownload' });
    const input = screen.getByLabelText('Upload Resume');

    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid file format. Allowed: .pdf, .docx/i)).toBeInTheDocument();
      expect(mediaApi.uploadFile).not.toHaveBeenCalled();
    });
  });

  it('renders AvatarUploader with name initial and camera trigger', () => {
    renderWithTheme(<AvatarUploader name="Alex Rivera" size={80} />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload avatar image')).toBeInTheDocument();
  });

  it('renders DocumentUploader with resume title and PDF/DOCX helper', () => {
    renderWithTheme(<DocumentUploader title="Upload Career Resume" category="resume" />);

    expect(screen.getByText('Upload Career Resume')).toBeInTheDocument();
    expect(screen.getByText(/Supported formats: PDF, DOCX/i)).toBeInTheDocument();
  });
});
