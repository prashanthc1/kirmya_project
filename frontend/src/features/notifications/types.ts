export type NotificationCategory =
  | 'Security'
  | 'Jobs'
  | 'Applications'
  | 'Interviews'
  | 'Recruiter'
  | 'Companies'
  | 'Networking'
  | 'Communities'
  | 'Career'
  | 'Resume'
  | 'Cover Letters'
  | 'AI'
  | 'System'
  | 'Support'
  | 'Marketing';

export type NotificationPriority = 'Critical' | 'High' | 'Normal' | 'Low';

export interface NotificationItemDTO {
  id: string;
  userId: string;
  category: NotificationCategory;
  type: string;
  priority: NotificationPriority;
  title: string;
  content: string;
  actorId?: string;
  actorName?: string;
  targetResource?: string;
  targetResourceType?: string;
  actionUrl?: string;
  icon?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  isArchived: boolean;
  groupId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationPreferenceDTO {
  userId: string;
  notificationType: string;
  category: NotificationCategory;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  frequency: 'Instant' | 'Daily Digest' | 'Weekly Digest' | 'Never';
}

export interface QuietHoursDTO {
  userId: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  days: string;
}

export interface NotificationDeviceDTO {
  id: string;
  userId: string;
  deviceToken: string;
  platform: 'web' | 'ios' | 'android';
  isActive: boolean;
  lastUsedAt: string;
}

export interface NotificationScheduleDTO {
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  content: string;
  targetResourceType?: string;
  targetResourceId?: string;
  actionUrl?: string;
  scheduledAt: string;
  status: 'Scheduled' | 'Processing' | 'Sent' | 'Cancelled';
  createdAt: string;
}

export interface NotificationDeliveryDTO {
  id: string;
  notificationId: string;
  userId: string;
  channel: 'in_app' | 'email' | 'push' | 'sms' | 'webhook';
  provider: string;
  status: 'Pending' | 'Queued' | 'Sent' | 'Delivered' | 'Opened' | 'Failed' | 'Expired' | 'Cancelled';
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  scheduledAt: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  createdAt: string;
}

export interface NotificationTemplateDTO {
  id: string;
  code: string;
  category: NotificationCategory;
  titleTemplate: string;
  contentTemplate: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  pushTitleTemplate?: string;
  pushBodyTemplate?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationAnalyticsDTO {
  totalCreated: number;
  totalSent: number;
  deliveryRate: number;
  failureRate: number;
  readRate: number;
  topTypes: Record<string, number>;
  volumeByChannel: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}
