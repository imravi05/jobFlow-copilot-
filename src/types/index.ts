export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Interview Scheduled'
  | 'Offer'
  | 'Rejected'
  | 'Accepted'
  | 'Withdrawn';

export interface JobApplication {
  id?: number;
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  jobDescription: string;
  employmentType: string; // e.g. Full-time, Part-time, Contract
  workMode: string;       // e.g. Remote, Hybrid, On-site
  portal: string;         // e.g. LinkedIn
  resumeId?: number;
  resumeName?: string;
  status: ApplicationStatus;
  notes: string;
  appliedDate: string;    // YYYY-MM-DD
  appliedTime: string;    // HH:MM
  createdAt: string;      // ISO string
  updatedAt: string;      // ISO string
  reminderSent: boolean;
}

export interface Resume {
  id?: number;
  name: string;
  fileName: string;
  uploadedDate: string;   // ISO string
}

export interface AppSettings {
  dailyGoal: number;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface Setting {
  key: string;
  value: any;
}

export interface MessagePayload {
  action: string;
  payload?: any;
}
