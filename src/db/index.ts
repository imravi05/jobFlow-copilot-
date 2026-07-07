import Dexie, { type Table } from 'dexie';
import { JobApplication, Resume, Setting } from '../types';

export class JobFlowDatabase extends Dexie {
  applications!: Table<JobApplication, number>;
  resumes!: Table<Resume, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super('JobFlowDatabase');
    this.version(1).stores({
      // ++id indicates auto-increment.
      // &jobUrl enforces uniqueness.
      // company, status, appliedDate, resumeId are indexed for fast searching/filtering.
      applications: '++id, company, status, appliedDate, resumeId, &jobUrl',
      resumes: '++id, name, fileName, uploadedDate',
      settings: 'key'
    });
  }
}

export const db = new JobFlowDatabase();
