import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import { Certificate } from '../types';

interface CertificatesViewerProps {
  certificates: Certificate[];
}

export const CertificatesViewer: React.FC<CertificatesViewerProps> = ({
  certificates,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Banner */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <WorkspacePremiumIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
            Verified Industry Credentials & Certificates
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Automated completion credentials earned through Kirmya Learning Hub. Share verified badges directly on your candidate profile and LinkedIn to demonstrate job readiness.
        </Typography>
      </Paper>

      {certificates.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#0f172a', border: '1px solid #334155' }}>
          <WorkspacePremiumIcon sx={{ fontSize: 48, color: '#334155', mb: 1 }} />
          <Typography variant="h6" sx={{ color: '#94a3b8' }}>No certificates earned yet</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Complete 100% of any course or learning path to automatically unlock your credential.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {certificates.map((cert) => (
            <Grid item xs={12} md={6} key={cert.id}>
              <Card sx={{ bgcolor: '#1e293b', border: '2px solid #f59e0b', borderRadius: 2.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, bgcolor: '#f59e0b22', borderRadius: '50%' }} />

                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<VerifiedIcon sx={{ color: '#fff !important' }} />}
                      label="VERIFIED CREDENTIAL"
                      size="small"
                      sx={{ bgcolor: '#f59e0b', color: '#0f172a', fontWeight: 'bold', fontSize: '0.75rem' }}
                    />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Issued: {new Date(cert.issue_date).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                    {cert.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                    Awarded to: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{cert.user_name || 'Alex Rivera'}</span>
                  </Typography>

                  <Box sx={{ bgcolor: '#0f172a', p: 1.5, borderRadius: 1.5, mb: 2, border: '1px solid #334155' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      Verification Code:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#e2e8f0', fontFamily: 'monospace' }}>
                      {cert.verification_code}
                    </Typography>
                  </Box>

                  {cert.skills_mastered && cert.skills_mastered.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                        Skills Validated:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {cert.skills_mastered.map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            size="small"
                            sx={{ bgcolor: '#0f172a', color: '#22c55e', fontSize: '0.7rem', border: '1px solid #22c55e' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ borderColor: '#334155', mb: 2 }} />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ShareIcon />}
                      onClick={() => alert(`Share URL: https://kirmya.dev/verify/${cert.verification_code}`)}
                      sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', flexGrow: 1, '&:hover': { bgcolor: '#0284c7' } }}
                    >
                      Share Credential
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => alert(`Downloading Certificate PDF for code ${cert.verification_code}...`)}
                      sx={{ color: '#f8fafc', borderColor: '#334155', fontWeight: 'bold' }}
                    >
                      Download PDF
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
export default CertificatesViewer;
