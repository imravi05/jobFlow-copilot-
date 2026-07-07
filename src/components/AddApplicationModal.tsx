import React, { useState, useEffect } from 'react';
import { useApplicationStore } from '../store/useApplicationStore';
import { useResumeStore } from '../store/useResumeStore';
import { ApplicationStatus } from '../types';
import { X, Briefcase, Plus, AlertTriangle } from 'lucide-react';
import { ApplicationRepository } from '../repositories/ApplicationRepository';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddApplicationModal({ isOpen, onClose }: AddApplicationModalProps) {
  const { addApplication, applications } = useApplicationStore();
  const { resumes } = useResumeStore();

  // Form fields state
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [workMode, setWorkMode] = useState('Remote');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [resumeId, setResumeId] = useState('');
  
  // Date and Time (defaulting to current local values)
  const [appliedDate, setAppliedDate] = useState('');
  const [appliedTime, setAppliedTime] = useState('');

  // Validation / Error state
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Default to today's date and current time when modal opens
      const now = new Date();
      setAppliedDate(now.toISOString().split('T')[0]);
      setAppliedTime(now.toTimeString().split(' ')[0].substring(0, 5));
      
      // Clear fields
      setCompany('');
      setTitle('');
      setLocation('');
      setJobUrl('');
      setNotes('');
      setStatus('Applied');
      setWorkMode('Remote');
      setEmploymentType('Full-time');
      setResumeId('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!company.trim() || !title.trim()) {
      setErrorMsg('Company Name and Role Title are required.');
      return;
    }

    // Normalise and check URL duplicates
    let normalizedUrl = jobUrl.trim();
    if (normalizedUrl) {
      normalizedUrl = ApplicationRepository.normalizeUrl(normalizedUrl);
      const isDuplicate = applications.some(
        (app) => ApplicationRepository.normalizeUrl(app.jobUrl) === normalizedUrl
      );
      if (isDuplicate) {
        setErrorMsg('An application with this Job URL already exists.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedResumeId = resumeId ? parseInt(resumeId, 10) : undefined;
      const selectedResume = resumes.find((r) => r.id === selectedResumeId);

      await addApplication({
        company: company.trim(),
        title: title.trim(),
        location: location.trim(),
        jobUrl: normalizedUrl,
        jobDescription: 'Manually logged application details.',
        employmentType,
        workMode,
        portal: 'Manual Entry',
        resumeId: selectedResumeId,
        resumeName: selectedResume ? selectedResume.name : undefined,
        status,
        notes: notes.trim(),
        appliedDate,
        appliedTime,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statuses: ApplicationStatus[] = [
    'Applied',
    'Under Review',
    'Interview Scheduled',
    'Offer',
    'Rejected',
    'Accepted',
    'Withdrawn',
  ];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Briefcase size={18} />
            </div>
            <h3 className="text-base font-bold text-foreground">Log Application Manually</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-medium">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Company & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Company Name *
              </label>
              <input
                type="text"
                placeholder="Google, Stripe, etc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Role Title *
              </label>
              <input
                type="text"
                placeholder="Software Engineer, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Row 2: Location & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                placeholder="Remote, San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Job URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/job"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Row 3: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Date Applied
              </label>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Time Applied
              </label>
              <input
                type="time"
                value={appliedTime}
                onChange={(e) => setAppliedTime(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Row 4: Status & Resume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Resume Used
              </label>
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="">-- No Resume --</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Work Mode & Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Work Mode
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Application Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contacts, interview deadlines, reference links..."
              rows={3}
              className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground/60 resize-y"
            />
          </div>

          {/* Form Footer */}
          <div className="flex gap-2 justify-end border-t border-border pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 font-medium shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
            >
              <Plus size={16} />
              {isSubmitting ? 'Saving...' : 'Add Job'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
