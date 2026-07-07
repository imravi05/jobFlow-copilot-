import { db } from '../db';
import { JobApplication } from '../types';

export class ApplicationRepository {
  static async getAll(): Promise<JobApplication[]> {
    return await db.applications.toArray();
  }

  static async getById(id: number): Promise<JobApplication | undefined> {
    return await db.applications.get(id);
  }

  static async getByUrl(url: string): Promise<JobApplication | undefined> {
    // Normalise URLs to prevent differences in query parameters from creating duplicates.
    const normalizedUrl = this.normalizeUrl(url);
    return await db.applications.where('jobUrl').equals(normalizedUrl).first();
  }

  static async add(app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const normalizedUrl = this.normalizeUrl(app.jobUrl);
    const existing = await this.getByUrl(normalizedUrl);
    
    if (existing) {
      throw new Error(`An application for this job URL already exists.`);
    }

    const now = new Date().toISOString();
    const newApp: JobApplication = {
      ...app,
      jobUrl: normalizedUrl,
      createdAt: now,
      updatedAt: now,
    };

    return (await db.applications.add(newApp)) as number;
  }

  static async update(id: number, app: Partial<Omit<JobApplication, 'id' | 'createdAt'>>): Promise<void> {
    const now = new Date().toISOString();
    const updates: Partial<JobApplication> = {
      ...app,
      updatedAt: now,
    };
    
    if (app.jobUrl) {
      updates.jobUrl = this.normalizeUrl(app.jobUrl);
    }

    await db.applications.update(id, updates);
  }

  static async delete(id: number): Promise<void> {
    await db.applications.delete(id);
  }

  static async clearAll(): Promise<void> {
    await db.transaction('rw', [db.applications, db.resumes, db.settings], async () => {
      await db.applications.clear();
      await db.resumes.clear();
      await db.settings.clear();
    });
  }

  /**
   * Helper to strip unnecessary query parameters from LinkedIn Job URLs
   * so duplicate checks remain reliable.
   */
  static normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('linkedin.com')) {
        // Keep only job ID in paths like /jobs/view/123456789/
        // Or if it's /jobs/search/?currentJobId=123456789, normalize it to /jobs/view/123456789/
        const jobIdMatch = parsed.pathname.match(/\/jobs\/view\/(\d+)/);
        if (jobIdMatch) {
          return `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}/`;
        }
        
        const currentJobId = parsed.searchParams.get('currentJobId');
        if (currentJobId) {
          return `https://www.linkedin.com/jobs/view/${currentJobId}/`;
        }
      }
      return url;
    } catch {
      return url;
    }
  }
}
