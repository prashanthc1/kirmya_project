export interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface Country {
  id: string;
  region_id: string;
  name: string;
  code: string;
  currency_code: string;
  flag_emoji: string;
  is_active: boolean;
}

export interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  usd_exchange_rate: number;
  updated_at: string;
}

export interface JobLocation {
  id: string;
  job_id: string;
  country_name: string;
  country_code: string;
  flag_emoji: string;
  city: string;
  work_arrangement: 'remote' | 'hybrid' | 'onsite';
}

export interface InternationalJobItem {
  job_id: string;
  title: string;
  company: string;
  region_code: string;
  primary_location: JobLocation;
  min_salary: number;
  max_salary: number;
  currency_code: string;
  formatted_salary: string;
  match_score: number;
  posted_time: string;
}
