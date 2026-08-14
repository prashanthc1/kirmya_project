import { authApiClient } from '../../../services/authService';

export interface DataImport {
  id: string;
  importType: string;
  status: string;
  strategy: string;
  originalFilename: string;
  fileSizeBytes: number;
  mimeType: string;
  columnMapping: Record<string, string>;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  errorReportUrl?: string;
  requestedBy: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface ImportPreviewResult {
  detectedColumns: string[];
  mappedFields: Record<string, string>;
  sampleRows: Record<string, string>[];
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateCount: number;
  validationErrors: Array<{ row: number; field: string; error: string; rowData: any }>;
}

export interface DataExport {
  id: string;
  exportType: string;
  format: 'zip' | 'csv' | 'json';
  status: string;
  filters: Record<string, any>;
  fieldsSelected: string[];
  includePii: boolean;
  fileSizeBytes: number;
  downloadUrl?: string;
  manifest: Record<string, any>;
  exportVersion: string;
  requestedBy: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface BulkOperation {
  id: string;
  operationType: string;
  targetScope: string;
  status: string;
  totalTargetCount: number;
  processedCount: number;
  successfulCount: number;
  failedCount: number;
  payload: Record<string, any>;
  requestedBy: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DataMigration {
  id: string;
  migrationCode: string;
  title: string;
  version: string;
  status: string;
  sourceTable: string;
  targetTable: string;
  recordsMigrated: number;
  reconciliationMatched: boolean;
  errorSummary?: string;
  executedBy: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

const apiClient = authApiClient;

export const dataOpsApi = {
  // User Data Exports
  async requestUserExport(): Promise<DataExport> {
    const res = await apiClient.post<DataExport>('/settings/data-export');
    return res.data;
  },

  async getUserExportHistory(): Promise<DataExport[]> {
    try {
      const res = await apiClient.get<DataExport[]>('/settings/data-export/history');
      return res.data;
    } catch {
      return [];
    }
  },

  // Admin Imports
  async previewImport(importType: string, csvContent: string, columnMapping?: Record<string, string>): Promise<ImportPreviewResult> {
    const res = await apiClient.post<ImportPreviewResult>('/admin/data-operations/imports/preview', {
      importType,
      csvContent,
      columnMapping,
    });
    return res.data;
  },

  async createImport(importType: string, strategy: string, originalFilename: string, csvContent: string, columnMapping?: Record<string, string>): Promise<DataImport> {
    const res = await apiClient.post<DataImport>('/admin/data-operations/imports', {
      importType,
      strategy,
      originalFilename,
      csvContent,
      columnMapping,
    });
    return res.data;
  },

  async listAdminImports(): Promise<DataImport[]> {
    try {
      const res = await apiClient.get<DataImport[]>('/admin/data-operations/imports');
      return res.data;
    } catch {
      return [];
    }
  },

  // Admin Exports
  async createAdminExport(exportType: string, format: string, filters?: Record<string, any>, fieldsSelected?: string[], includePii?: boolean): Promise<DataExport> {
    const res = await apiClient.post<DataExport>('/admin/data-operations/exports', {
      exportType,
      format,
      filters,
      fieldsSelected,
      includePii,
    });
    return res.data;
  },

  async listAdminExports(): Promise<DataExport[]> {
    try {
      const res = await apiClient.get<DataExport[]>('/admin/data-operations/exports');
      return res.data;
    } catch {
      return [];
    }
  },

  // Bulk Operations
  async executeBulkOperation(operationType: string, targetScope: string, targetIds: string[], actionPayload: Record<string, any>, isDryRun?: boolean): Promise<BulkOperation> {
    const res = await apiClient.post<BulkOperation>('/admin/data-operations/bulk-operations', {
      operationType,
      targetScope,
      targetIds,
      actionPayload,
      isDryRun,
    });
    return res.data;
  },

  async listBulkOperations(): Promise<BulkOperation[]> {
    try {
      const res = await apiClient.get<BulkOperation[]>('/admin/data-operations/bulk-operations');
      return res.data;
    } catch {
      return [];
    }
  },

  // Migrations
  async listDataMigrations(): Promise<DataMigration[]> {
    try {
      const res = await apiClient.get<DataMigration[]>('/admin/data-operations/migrations');
      return res.data;
    } catch {
      return [];
    }
  },
};
