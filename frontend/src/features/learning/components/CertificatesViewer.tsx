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
      <Paper sx={{ p: 3, mb: 3, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <WorkspacePremiumIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary" }}>
            Verified Industry Credentials & Certificates
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Automated completion credentials earned through Kirmya Learning Hub. Share verified badges directly on your candidate profile and LinkedIn to demonstrate job readiness.
        </Typography>
      </Paper>

      {certificates.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: "background.default", border: (theme) => `1px solid ${theme.palette.divider}` }}>
          <WorkspacePremiumIcon sx={{ fontSize: 48, color: "text.primary", mb: 1 }} />
          <Typography variant="h6" sx={{ color: "text.secondary" }}>No certificates earned yet</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Complete 100% of any course or learning path to automatically unlock your credential.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {certificates.map((cert) => (
            <Grid item xs={12} md={6} key={cert.id}>
              <Card sx={{ bgcolor: "background.paper", border: '2px solid #f59e0b', borderRadius: 2.5, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, bgcolor: '#f59e0b22', borderRadius: '50%' }} />

                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<VerifiedIcon sx={{ color: '#fff !important' }} />}
                      label="VERIFIED CREDENTIAL"
                      size="small"
                      sx={{ bgcolor: '#f59e0b', color: "warning.contrastText", fontWeight: 'bold', fontSize: '0.75rem' }}
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Issued: {new Date(cert.issue_date).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", mb: 1 }}>
                    {cert.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                    Awarded to: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{cert.user_name || 'Alex Rivera'}</span>
                  </Typography>

                  <Box sx={{ bgcolor: "background.default", p: 1.5, borderRadius: 1.5, mb: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: 'block' }}>
                      Verification Code:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: "text.primary", fontFamily: 'monospace' }}>
                      {cert.verification_code}
                    </Typography>
                  </Box>

                  {cert.skills_mastered && cert.skills_mastered.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: 'block', mb: 0.5 }}>
                        Skills Validated:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {cert.skills_mastered.map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            size="small"
                            sx={{ bgcolor: "background.default", color: '#22c55e', fontSize: '0.7rem', border: '1px solid #22c55e' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ borderColor: "divider", mb: 2 }} />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ShareIcon />}
                      onClick={() => alert(`Share URL: https://kirmya.dev/verify/${cert.verification_code}`)}
                      sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold', flexGrow: 1, '&:hover': { bgcolor: "primary.main" } }}
                    >
                      Share Credential
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => alert(`Downloading Certificate PDF for code ${cert.verification_code}...`)}
                      sx={{ color: "text.primary", borderColor: "divider", fontWeight: 'bold' }}
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
