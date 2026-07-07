export interface ScrapedJobDetails {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  jobDescription: string;
  employmentType: string; // e.g. Full-time, Part-time
  workMode: string;       // e.g. Remote, Hybrid, On-site
  portal: string;         // e.g. LinkedIn
}

export interface JobPortalScraper {
  isSupported(url: string): boolean;
  extractJobDetails(): Promise<ScrapedJobDetails>;
}
