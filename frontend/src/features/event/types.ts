export type EventCategory = 
  | 'career_event'
  | 'webinar'
  | 'hiring_event'
  | 'community_meetup';

export interface EventHost {
  id: string;
  user_id: string;
  host_name: string;
  company_name: string;
  title: string;
  bio?: string;
  avatar_url?: string;
  verified_host: boolean;
  created_at: string;
}

export interface LiveStreamInfo {
  stream_url: string;
  provider: string;
  room_id: string;
  access_token?: string;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  event_type: EventCategory;
  description: string;
  start_time: string;
  end_time: string;
  max_attendees: number;
  current_attendees: number;
  location_type: 'virtual' | 'in_person';
  live_stream_url?: string;
  banner_image_url?: string;
  status: 'upcoming' | 'live' | 'completed';
  created_at: string;
  updated_at: string;
  host?: EventHost;
  is_registered?: boolean;
  live_stream?: LiveStreamInfo;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'registered' | 'attended' | 'cancelled';
  checked_in_at?: string;
  created_at: string;
}

export interface CreateEventPayload {
  title: string;
  event_type: EventCategory;
  description: string;
  start_time: string;
  end_time: string;
  max_attendees?: number;
  location_type?: 'virtual' | 'in_person';
  banner_image_url?: string;
  host_name?: string;
  company_name?: string;
  host_title?: string;
}

export interface RegisterEventPayload {
  user_name?: string;
  user_email?: string;
}
