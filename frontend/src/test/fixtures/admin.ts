// Sample records for the admin component tests.
//
// These lived inside the API client, which returned them whenever a request
// failed, so a broken console looked like a working one and the suite proved
// the samples rather than the client. They are fixtures now: the tests feed
// them through a mocked HTTP layer.
import {
  BackgroundJobDTO,
  IncidentDTO,
  MaintenanceModeConfigDTO,
  UserImpersonationSessionDTO,
} from '../../features/admin/types';

export const MOCK_JOBS: BackgroundJobDTO[] = [
  {
    id: 'job-101',
    name: 'email.bulk_notifications',
    queue: 'high_priority',
    status: 'failed',
    attempts: 3,
    maxAttempts: 3,
    failedReason: 'SMTP Connection timeout after 30s',
    createdAt: '2026-08-15T10:00:00Z',
    startedAt: '2026-08-15T10:00:05Z',
  },
  {
    id: 'job-102',
    name: 'analytics.daily_aggregate',
    queue: 'default',
    status: 'running',
    attempts: 1,
    maxAttempts: 3,
    createdAt: '2026-08-15T11:30:00Z',
    startedAt: '2026-08-15T11:30:02Z',
  },
  {
    id: 'job-103',
    name: 'embedding.vector_indexing',
    queue: 'ai_queue',
    status: 'completed',
    attempts: 1,
    maxAttempts: 5,
    createdAt: '2026-08-15T09:15:00Z',
    startedAt: '2026-08-15T09:15:01Z',
    completedAt: '2026-08-15T09:18:22Z',
  },
  {
    id: 'job-104',
    name: 'search.reindex_listings',
    queue: 'low_priority',
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: '2026-08-15T12:00:00Z',
  },
];

export const MOCK_INCIDENTS: IncidentDTO[] = [
  {
    id: 'inc-001',
    title: 'Intermittent Search Service Latency Spikes',
    description: 'Vector search database node memory pressure causing elevated response times.',
    status: 'Investigating',
    severity: 'Major',
    affectedServices: ['Search Engine', 'Job Recommendations'],
    updates: [
      {
        id: 'u-1',
        status: 'Open',
        message: 'Elevated latency detected across elasticsearch cluster.',
        createdAt: '2026-08-15T11:00:00Z',
        author: 'SRE Monitor System',
      },
      {
        id: 'u-2',
        status: 'Investigating',
        message: 'Engineers investigating heap utilization on node-03.',
        createdAt: '2026-08-15T11:15:00Z',
        author: 'Lead Platform Ops',
      },
    ],
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-08-15T11:15:00Z',
  },
  {
    id: 'inc-002',
    title: 'Payment Webhook Processing Backlog',
    description: 'Third-party provider gateway rate-limiting webhook delivery.',
    status: 'Mitigated',
    severity: 'Minor',
    affectedServices: ['Billing Gateway', 'Subscription Sync'],
    updates: [
      {
        id: 'u-3',
        status: 'Mitigated',
        message: 'Rate limits adjusted with provider; backlog clearing rapidly.',
        createdAt: '2026-08-15T08:30:00Z',
        author: 'DevOps Engineer',
      },
    ],
    createdAt: '2026-08-15T07:00:00Z',
    updatedAt: '2026-08-15T08:30:00Z',
  },
];

export const MOCK_MAINTENANCE: MaintenanceModeConfigDTO = {
  enabled: false,
  message: 'Kirmya system maintenance in progress. We will return online shortly.',
  allowedIpAddresses: ['192.168.1.1', '10.0.0.100'],
  scheduledStartTime: '2026-08-20T02:00:00Z',
  scheduledEndTime: '2026-08-20T04:00:00Z',
  bypassToken: 'kirmya-maint-bypass-99812',
  updatedBy: 'admin@kirmya.com',
  updatedAt: '2026-08-14T18:00:00Z',
};

export const MOCK_IMPERSONATION_SESSIONS: UserImpersonationSessionDTO[] = [
  {
    id: 'imp-sess-1',
    adminId: 'admin-001',
    targetUserId: 'u1',
    targetUserEmail: 'tariq@kirmya.com',
    reason: 'Investigating missing application notification bug',
    status: 'active',
    expiresAt: '2026-08-15T14:30:00Z',
    createdAt: '2026-08-15T13:30:00Z',
  },
];
