'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  LinearProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import TransformIcon from '@mui/icons-material/Transform';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { dataOpsApi, DataImport, DataExport, BulkOperation, DataMigration } from '../../../features/data_operations/services/dataOpsApi';
import ImportWizardModal from './ImportWizardModal';

export default function DataOperationsStudio() {
  const [tab, setTab] = useState(0);
  const [imports, setImports] = useState<DataImport[]>([]);
  const [exports, setExports] = useState<DataExport[]>([]);
  const [bulkOps, setBulkOps] = useState<BulkOperation[]>([]);
  const [migrations, setMigrations] = useState<DataMigration[]>([]);
  const [loading, setLoading] = useState(true);
  const [importWizardOpen, setImportWizardOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [impData, expData, bulkData, migData] = await Promise.all([
        dataOpsApi.listAdminImports(),
        dataOpsApi.listAdminExports(),
        dataOpsApi.listBulkOperations(),
        dataOpsApi.listDataMigrations(),
      ]);
      setImports(impData);
      setExports(expData);
      setBulkOps(bulkData);
      setMigrations(migData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerExport = async (type: string) => {
    await dataOpsApi.createAdminExport(type, 'csv', {}, ['id', 'title', 'created_at'], false);
    await loadData();
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#a855f7', p: 1.5, borderRadius: 2, color: '#0f172a', display: 'flex' }}>
              <DynamicFeedIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #a855f7 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya Data Operations, Import & Bulk Studio
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                CSV Import Engine • Formula Injection Protection • Pre-commit Dry Run • PII Protected Exports
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={() => handleTriggerExport('admin_jobs')}
              sx={{ color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 'bold' }}
            >
              Export Jobs CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setImportWizardOpen(true)}
              sx={{ bgcolor: '#a855f7', color: '#ffffff', fontWeight: 'bold', '&:hover': { bgcolor: '#9333ea' } }}
            >
              Launch CSV Import Wizard
            </Button>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#a855f7' } }} />}

        {/* Top Summary Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>TOTAL IMPORTS</Typography>
                  <CloudUploadIcon sx={{ color: '#a855f7' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', mb: 0.5 }}>
                  {imports.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Formula Injection Protected</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ACTIVE EXPORTS</Typography>
                  <CloudDownloadIcon sx={{ color: '#38bdf8' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#38bdf8', mb: 0.5 }}>
                  {exports.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Signed URLs • 24h Expiration</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>BULK OPERATIONS</Typography>
                  <DynamicFeedIcon sx={{ color: '#10b981' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', mb: 0.5 }}>
                  {bulkOps.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Dry-run Previews Enabled</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>MIGRATIONS RUN</Typography>
                  <TransformIcon sx={{ color: '#f59e0b' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b', mb: 0.5 }}>
                  {migrations.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Reconciliation Verified</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabbed Operations Table */}
        <Paper sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, mb: 4 }}>
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            sx={{ borderBottom: '1px solid #334155', '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold' }, '& .Mui-selected': { color: '#a855f7' } }}
          >
            <Tab label="Import Jobs" />
            <Tab label="Export Records" />
            <Tab label="Bulk Operations" />
            <Tab label="Data Migrations" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Tab 0: Imports */}
            {tab === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: '#94a3b8', fontWeight: 'bold', borderColor: '#334155' } }}>
                      <TableCell>Import ID / Type</TableCell>
                      <TableCell>Filename</TableCell>
                      <TableCell>Strategy</TableCell>
                      <TableCell>Rows (Total/Valid/Failed)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {imports.map((imp) => (
                      <TableRow key={imp.id} sx={{ '& td': { color: '#f8fafc', borderColor: '#334155' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{imp.id.substring(0, 8)}...</Typography>
                          <Chip label={imp.importType} size="small" sx={{ bgcolor: '#0f172a', color: '#a855f7', fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell>{imp.originalFilename}</TableCell>
                        <TableCell><Chip label={imp.strategy} size="small" variant="outlined" sx={{ color: '#cbd5e1', borderColor: '#475569' }} /></TableCell>
                        <TableCell>{imp.totalRows} / {imp.successfulRows} / {imp.failedRows}</TableCell>
                        <TableCell><Chip label={imp.status} color={imp.status === 'completed' ? 'success' : 'warning'} size="small" /></TableCell>
                        <TableCell align="right">{new Date(imp.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Tab 1: Exports */}
            {tab === 1 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: '#94a3b8', fontWeight: 'bold', borderColor: '#334155' } }}>
                      <TableCell>Export ID / Type</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>PII Protection</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Signed Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exports.map((exp) => (
                      <TableRow key={exp.id} sx={{ '& td': { color: '#f8fafc', borderColor: '#334155' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{exp.id.substring(0, 8)}...</Typography>
                          <Chip label={exp.exportType} size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8', fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell><Chip label={exp.format.toUpperCase()} size="small" sx={{ bgcolor: '#1e293b' }} /></TableCell>
                        <TableCell>{exp.includePii ? <Chip label="Includes PII" color="warning" size="small" /> : <Chip label="PII Omitted" color="success" size="small" />}</TableCell>
                        <TableCell>{(exp.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</TableCell>
                        <TableCell><Chip label={exp.status} color="success" size="small" /></TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="text" sx={{ color: '#38bdf8' }} href={exp.downloadUrl || '#'}>
                            Download Package
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Tab 2: Bulk Ops */}
            {tab === 2 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: '#94a3b8', fontWeight: 'bold', borderColor: '#334155' } }}>
                      <TableCell>Operation ID / Type</TableCell>
                      <TableCell>Target Scope</TableCell>
                      <TableCell>Target Records</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bulkOps.map((b) => (
                      <TableRow key={b.id} sx={{ '& td': { color: '#f8fafc', borderColor: '#334155' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{b.id.substring(0, 8)}...</Typography>
                          <Chip label={b.operationType} size="small" sx={{ bgcolor: '#0f172a', color: '#10b981', fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell>{b.targetScope}</TableCell>
                        <TableCell>{b.totalTargetCount} items</TableCell>
                        <TableCell><Chip label={b.status} color={b.status === 'completed' ? 'success' : 'info'} size="small" /></TableCell>
                        <TableCell align="right">{new Date(b.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Tab 3: Migrations */}
            {tab === 3 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: '#94a3b8', fontWeight: 'bold', borderColor: '#334155' } }}>
                      <TableCell>Migration Code</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Source -> Target</TableCell>
                      <TableCell>Records Migrated</TableCell>
                      <TableCell>Reconciliation</TableCell>
                      <TableCell align="right">Executed At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {migrations.map((m) => (
                      <TableRow key={m.id} sx={{ '& td': { color: '#f8fafc', borderColor: '#334155' } }}>
                        <TableCell><Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>{m.migrationCode}</Typography></TableCell>
                        <TableCell>{m.title}</TableCell>
                        <TableCell>{m.sourceTable} → {m.targetTable}</TableCell>
                        <TableCell>{m.recordsMigrated}</TableCell>
                        <TableCell>{m.reconciliationMatched ? <Chip label="Reconciled" color="success" size="small" /> : <Chip label="Mismatch" color="error" size="small" />}</TableCell>
                        <TableCell align="right">{new Date(m.startedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>

        <ImportWizardModal open={importWizardOpen} onClose={() => setImportWizardOpen(false)} onComplete={loadData} />
      </Container>
    </Box>
  );
}
