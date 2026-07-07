import React, { useState } from 'react';
import { useApplicationStore } from '../store/useApplicationStore';
import { useResumeStore } from '../store/useResumeStore';
import { JobApplication, ApplicationStatus } from '../types';
import { 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  X, 
  FileEdit, 
  ArrowUpDown,
  BookOpen
} from 'lucide-react';

type SortField = 'date' | 'company' | 'title';
type SortOrder = 'asc' | 'desc';

export default function HistoryPage() {
  const { applications, updateApplication, deleteApplication, isLoading } = useApplicationStore();
  const { resumes } = useResumeStore();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resumeFilter, setResumeFilter] = useState<string>('all');
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<ApplicationStatus>('Applied');
  const [editResumeId, setEditResumeId] = useState<string>('');

  const statuses: ApplicationStatus[] = [
    'Applied',
    'Under Review',
    'Interview Scheduled',
    'Offer',
    'Rejected',
    'Accepted',
    'Withdrawn',
  ];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleOpenDetail = (app: JobApplication) => {
    setSelectedApp(app);
    setEditNotes(app.notes);
    setEditStatus(app.status);
    setEditResumeId(app.resumeId?.toString() || '');
  };

  const handleSaveDetails = async () => {
    if (!selectedApp || !selectedApp.id) return;
    
    const resumeIdNum = editResumeId ? parseInt(editResumeId, 10) : undefined;
    const selectedResume = resumes.find(r => r.id === resumeIdNum);

    try {
      await updateApplication(selectedApp.id, {
        status: editStatus,
        notes: editNotes,
        resumeId: resumeIdNum,
        resumeName: selectedResume ? selectedResume.name : undefined
      });
      setSelectedApp(null);
    } catch (e) {
      alert('Error updating application: ' + e);
    }
  };

  const handleDeleteApp = async (id: number) => {
    if (confirm('Are you sure you want to delete this job application tracking? This cannot be undone.')) {
      try {
        await deleteApplication(id);
        setSelectedApp(null);
      } catch (e) {
        alert('Error deleting: ' + e);
      }
    }
  };

  const handleInlineStatusChange = async (id: number, status: ApplicationStatus) => {
    try {
      await updateApplication(id, { status });
    } catch (e) {
      alert('Error: ' + e);
    }
  };

  // 1. Filter applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    const matchesResume =
      resumeFilter === 'all' ||
      (resumeFilter === 'none' && !app.resumeId) ||
      app.resumeId?.toString() === resumeFilter;

    return matchesSearch && matchesStatus && matchesResume;
  });

  // 2. Sort applications
  const sortedApps = [...filteredApps].sort((a, b) => {
    let compare = 0;
    if (sortField === 'date') {
      const dateA = new Date(`${a.appliedDate}T${a.appliedTime || '00:00'}`);
      const dateB = new Date(`${b.appliedDate}T${b.appliedTime || '00:00'}`);
      compare = dateA.getTime() - dateB.getTime();
    } else if (sortField === 'company') {
      compare = a.company.localeCompare(b.company);
    } else if (sortField === 'title') {
      compare = a.title.localeCompare(b.title);
    }
    return sortOrder === 'asc' ? compare : -compare;
  });

  const getStatusBadgeClass = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Under Review':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Interview Scheduled':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Offer':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Rejected':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Accepted':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Withdrawn':
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hidden sm:block">
        <h1 className="text-2xl font-bold tracking-tight">Application History</h1>
        <p className="text-sm text-muted-foreground">Manage, search, and update details for all tracked applications.</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company, title, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-2">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>

          {/* Resume Filter */}
          <div className="relative">
            <select
              value={resumeFilter}
              onChange={(e) => setResumeFilter(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none font-medium cursor-pointer"
            >
              <option value="all">All Resumes</option>
              <option value="none">No Resume</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading applications...</div>
        ) : sortedApps.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No applications match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted/40 select-none">
                <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th 
                    onClick={() => handleSort('company')}
                    className="p-4 cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Company <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('title')}
                    className="p-4 cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Role <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('date')}
                    className="p-4 cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Applied Date <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="p-4">Resume</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedApps.map((app) => (
                  <tr 
                    key={app.id} 
                    onClick={() => handleOpenDetail(app)}
                    className="hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-foreground">{app.company}</td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-foreground">{app.title}</div>
                        <div className="text-xs text-muted-foreground font-normal sm:hidden">{app.location}</div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {app.appliedDate} <span className="text-xs text-muted-foreground/50">{app.appliedTime}</span>
                    </td>
                    <td className="p-4 text-muted-foreground truncate max-w-[150px]">
                      {app.resumeName || <span className="text-muted-foreground/40 italic">None</span>}
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={app.status}
                        onChange={(e) => handleInlineStatusChange(app.id!, e.target.value as ApplicationStatus)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadgeClass(app.status)}`}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Detail Modal / Sheet */}
      {selectedApp && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div className="min-w-0 pr-4">
                <h3 className="text-lg font-bold text-foreground truncate">{selectedApp.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {selectedApp.company} · {selectedApp.location} · {selectedApp.workMode}
                </p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block uppercase font-bold tracking-wider text-[10px] mb-1">Employment Type</span>
                  <span className="font-semibold">{selectedApp.employmentType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase font-bold tracking-wider text-[10px] mb-1">Job Link</span>
                  <a 
                    href={selectedApp.jobUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Open on LinkedIn <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Status and Resume Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Application Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ApplicationStatus)}
                    className="w-full bg-background border border-border rounded-xl text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Resume Associated
                  </label>
                  <select
                    value={editResumeId}
                    onChange={(e) => setEditResumeId(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- No Resume --</option>
                    {resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  My Application Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Insert notes about recruiters, contacts, interview logs..."
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground/60 resize-y"
                />
              </div>

              {/* Job Description (collapsible scroll box) */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <BookOpen size={14} />
                  Original Job Description
                </label>
                <div 
                  className="mt-1.5 bg-background border border-border rounded-xl p-4 text-xs overflow-y-auto max-h-[160px] leading-relaxed text-muted-foreground select-text"
                  dangerouslySetInnerHTML={{ __html: selectedApp.jobDescription }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
              <button
                onClick={() => handleDeleteApp(selectedApp.id!)}
                className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-500/5 transition-colors"
              >
                <Trash2 size={15} />
                Delete Entry
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
