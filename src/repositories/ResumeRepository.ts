import { db } from '../db';
import { Resume } from '../types';

export class ResumeRepository {
  static async getAll(): Promise<Resume[]> {
    return await db.resumes.toArray();
  }

  static async getById(id: number): Promise<Resume | undefined> {
    return await db.resumes.get(id);
  }

  static async add(resume: Omit<Resume, 'id'>): Promise<number> {
    return (await db.resumes.add(resume)) as number;
  }

  static async update(id: number, resume: Partial<Resume>): Promise<void> {
    await db.resumes.update(id, resume);
  }

  static async delete(id: number): Promise<void> {
    await db.transaction('rw', [db.resumes, db.applications], async () => {
      await db.resumes.delete(id);
      
      // Keep the string resumeName in job applications but set resumeId to undefined
      // so historical applications aren't broken, just detached from the active resume metadata list.
      await db.applications
        .where('resumeId')
        .equals(id)
        .modify({ resumeId: undefined });
    });
  }
}
