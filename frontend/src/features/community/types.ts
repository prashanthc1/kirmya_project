export interface Community {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  isPrivate: boolean;
  memberCount: number;
  postCount: number;
  rules: string[];
  topics: string[];
  postingPermission: 'all' | 'mods_only' | 'approved_only';
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member' | null;
  isMember?: boolean;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  title?: string;
  company?: string;
  joinedAt: string;
  status: 'active' | 'banned' | 'muted';
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  title?: string;
  content: string;
  isPinned: boolean;
  isAnnouncement: boolean;
  isLocked: boolean;
  category?: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  userLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  communityId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline: boolean;
  meetingUrl?: string;
  organizerId: string;
  organizerName: string;
  rsvpCount: number;
  userRsvp?: 'attending' | 'declined' | 'maybe' | null;
  capacity?: number;
  createdAt: string;
}

export interface CommunityResource {
  id: string;
  communityId: string;
  title: string;
  description: string;
  category: 'guide' | 'document' | 'link' | 'template' | 'code';
  url: string;
  fileType?: string;
  authorId: string;
  authorName: string;
  downloadsCount: number;
  createdAt: string;
}

export interface CommunityModerationAction {
  id: string;
  communityId: string;
  targetType: 'post' | 'comment' | 'member';
  targetId: string;
  targetContentSnippet?: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  actionTaken?: 'dismiss' | 'pin' | 'lock' | 'delete' | 'ban_user' | 'mute_user' | 'warn';
  moderatorId?: string;
  moderatorName?: string;
  notes?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface CommunityInvite {
  id: string;
  communityId: string;
  email: string;
  role: 'admin' | 'moderator' | 'member';
  inviterId: string;
  inviterName: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface CommunityJoinRequest {
  id: string;
  communityId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userTitle?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
