export interface ConnectionNote {
  id: string;
  connectionId: string;
  text: string;
  labels?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ConnectionLabel {
  id: string;
  name: string;
  color?: string;
  count?: number;
}

export interface Connection {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  industry?: string;
  company?: string;
  connectedAt?: string;
  notes?: ConnectionNote[];
  labels?: ConnectionLabel[] | string[];
  mutualCount?: number;
  openToWork?: boolean;
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | string;
  note?: string;
  createdAt: string;
  senderName?: string;
  senderHeadline?: string;
  senderAvatarUrl?: string;
  receiverName?: string;
  receiverHeadline?: string;
  receiverAvatarUrl?: string;
}

export interface PeopleSearchResult {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  headline?: string;
  currentPosition?: string;
  company?: string;
  location?: string;
  industry?: string;
  openToWork?: boolean;
  mutualCount: number;
  mutualConnections?: string[];
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';
  isFollowing?: boolean;
  verificationStatus?: string;
  skills?: string[];
  degree?: '1st' | '2nd' | '3rd' | string;
  recommendationReason?: string;
}

export interface ConnectionRecommendation {
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  industry?: string;
  currentCompany?: string;
  mutualCount: number;
  mutualConnections?: string[];
  matchScore: number;
  reason?: string;
  connectionStatus?: string;
  isFollowing?: boolean;
}

export interface MutualConnectionsResult {
  targetUserId: string;
  mutualCount: number;
  mutuals: PeopleSearchResult[];
}

export interface NetworkingGoal {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  deadline?: string;
  category?: 'connect' | 'outreach' | 'referral' | 'event' | string;
  completed: boolean;
  createdAt: string;
}

export interface NetworkGrowthStats {
  totalConnections: number;
  pendingReceived: number;
  pendingSent: number;
  networkGrowthThisMonth: number;
  profileViews: number;
  searchAppearances: number;
  goalProgress?: {
    totalGoals: number;
    completedGoals: number;
    targetConnectionsCount: number;
  };
}

export interface CompanyConnection {
  id: string;
  companyName: string;
  companyLogo?: string;
  connectionCount: number;
  connections: Connection[];
  department?: string;
}
