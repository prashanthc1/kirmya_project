import { authApiClient } from '../../../services/authService';

export interface BackupRecord {
  id: string;
  backupType: 'full' | 'pitr_wal' | 'object_storage' | 'export';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'corrupted';
  sizeBytes: number;
  checksum: string;
  storageLocation: string;
  appVersion: string;
  migrationVersion: number;
  verificationStatus: 'unverified' | 'verified' | 'failed';
  retentionExpiresAt: string;
  isImmutable: boolean;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface BackupHealthSummary {
  status: string;
  lastSuccessfulBackupAt: string | null;
  lastFailedBackupAt: string | null;
  backupAgeMinutes: number;
  totalBackupSizeBytes: number;
  verifiedCount: number;
  pendingCount: number;
  failedCount: number;
  lastRestoreTestStatus: string;
  lastRestoreTestAt: string | null;
  activeIncidentsCount: number;
  rpoStatus: string;
  rtoStatus: string;
  encryptionVaultProtected: boolean;
}

export interface BackupConfiguration {
  id: string;
  backupScheduleCron: string;
  retentionDaysDaily: number;
  retentionWeeksWeekly: number;
  retentionMonthsMonthly: number;
  encryptionEnabled: boolean;
  storageProvider: string;
  targetRpoMinutes: number;
  targetRtoMinutes: number;
  autoRestoreTestEnabled: boolean;
  isEnabled: boolean;
  updatedAt: string;
}

export interface RestoreTest {
  id: string;
  backupId: string;
  environment: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  verificationResults: Record<string, any>;
  failureReason?: string;
}

export interface RecoveryIncident {
  id: string;
  incidentNumber: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  scenario: string;
  status: string;
  recoveryPoint: string;
  rpoAchievedSec: number;
  rtoAchievedSec: number;
  rootCause?: string;
  resolutionSummary?: string;
  startedAt: string;
  resolvedAt?: string;
}

export interface DataTierClassification {
  tier: string;
  category: string;
  dataTypes: string[];
  targetRpo: string;
  targetRto: string;
  description: string;
}

const apiClient = authApiClient;

export const backupApi = {
  async getHealthSummary(): Promise<BackupHealthSummary> {
    const res = await apiClient.get<BackupHealthSummary>('/admin/backups/health');
    return res.data;
    
  },

  async listBackups(type?: string, status?: string): Promise<BackupRecord[]> {
    const res = await apiClient.get<BackupRecord[]>('/admin/backups', { params: { type, status } });
    return res.data;
    
  },

  async triggerBackup(backupType: string, notes?: string): Promise<BackupRecord> {
    const res = await apiClient.post<BackupRecord>('/admin/backups', { backupType, notes });
    return res.data;
  },

  async verifyBackup(id: string): Promise<any> {
    const res = await apiClient.post(`/admin/backups/${id}/verify`);
    return res.data;
  },

  async listRestoreTests(): Promise<RestoreTest[]> {
    const res = await apiClient.get<RestoreTest[]>('/admin/backups/restore-tests');
    return res.data;
    
  },

  async runRestoreTest(backupId: string, environment?: string): Promise<RestoreTest> {
    const res = await apiClient.post<RestoreTest>('/admin/backups/restore-tests', { backupId, environment });
    return res.data;
  },

  async confirmProductionRestore(payload: {
    backupId: string;
    confirmationCode: string;
    targetEnvironment: string;
    reason: string;
    acknowledgeDataLoss: boolean;
  }): Promise<any> {
    const res = await apiClient.post('/admin/backups/restore-confirm', payload);
    return res.data;
  },

  async getConfiguration(): Promise<BackupConfiguration> {
    const res = await apiClient.get<BackupConfiguration>('/admin/backups/configuration');
    return res.data;
    
  },

  async updateConfiguration(cfg: Partial<BackupConfiguration>): Promise<any> {
    const res = await apiClient.put('/admin/backups/configuration', cfg);
    return res.data;
  },

  async listIncidents(): Promise<RecoveryIncident[]> {
    const res = await apiClient.get<RecoveryIncident[]>('/admin/backups/incidents');
    return res.data;
    
  },

  async createIncident(payload: { title: string; severity: string; scenario: string; description?: string }): Promise<RecoveryIncident> {
    const res = await apiClient.post<RecoveryIncident>('/admin/backups/incidents', payload);
    return res.data;
  },

  async getDataTiers(): Promise<DataTierClassification[]> {
    const res = await apiClient.get<DataTierClassification[]>('/admin/backups/tiers');
    return res.data;
    
  },
};
