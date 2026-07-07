import React from 'react';
import { useApplicationStore } from '../store/useApplicationStore';
import { 
  Briefcase, 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  Trophy, 
  ChevronRight, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { JobApplication } from '../types';

interface DashboardProps {
  onViewChange: (view: 'dashboard' | 'history' | 'resumes' | 'settings') => void;
  onAddClick?: () => void;
}

export default function Dashboard({ onViewChange, onAddClick }: DashboardProps) {
  const { stats, isLoading } = useApplicationStore();

  const handleOpenJob = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Under Review':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Interview Scheduled':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Offer':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Accepted':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Withdrawn':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title (Only visible in full dashboard view) */}
      <div className="hidden sm:block">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Track your applications progress and goals.</p>
      </div>

      {/* Grid: Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Apps */}
        <div className="glow-card bg-card p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Apps</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight">{stats.total}</span>
          </div>
        </div>

        {/* Applied Today */}
        <div className="glow-card bg-card p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Applied Today</span>
            <div className="p-2 bg-green-500/10 rounded-xl text-green-500">
              <Calendar size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight">{stats.today}</span>
          </div>
        </div>

        {/* This Week */}
        <div className="glow-card bg-card p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">This Week</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <CalendarDays size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight">{stats.thisWeek}</span>
          </div>
        </div>

        {/* This Month */}
        <div className="glow-card bg-card p-4 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">This Month</span>
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
              <CalendarRange size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold tracking-tight">{stats.thisMonth}</span>
          </div>
        </div>
      </div>

      {/* Grid: Goals and Recents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Goal Card */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm tracking-tight text-foreground">Daily Goal</h2>
              <Trophy size={16} className="text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Keep your job search momentum going.</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center w-28 h-28">
              {/* Radial Circle Background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-muted"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-primary transition-all duration-500 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - stats.dailyGoalProgress / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black">{stats.today}</span>
                <span className="text-[10px] text-muted-foreground font-medium">of {stats.dailyGoal} jobs</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary mt-4">
              {stats.dailyGoalProgress}% Completed
            </span>
          </div>

          <div className="text-center text-[11px] text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
            {stats.today >= stats.dailyGoal ? (
              <span className="text-green-500 font-semibold">Trophy earned! You hit your daily goal! 🎉</span>
            ) : (
              <span>Apply to {stats.dailyGoal - stats.today} more jobs today to reach your goal.</span>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-sm tracking-tight text-foreground">Recent Applications</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Quick view of your latest entries.</p>
              </div>
              <button 
                onClick={() => onViewChange('history')}
                className="text-xs text-primary font-semibold flex items-center hover:underline hover:underline-offset-2"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            {stats.recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 border border-dashed border-border rounded-xl">
                <Briefcase size={24} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">No applications tracked yet.</p>
                {onAddClick && (
                  <button
                    onClick={onAddClick}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow hover:bg-primary/95 transition-all flex items-center gap-1"
                  >
                    Log Application
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => onViewChange('history')}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:bg-muted/30 cursor-pointer transition-all duration-200"
                  >
                    <div className="min-w-0 pr-4">
                      <h4 className="font-semibold text-xs text-foreground truncate">{app.title}</h4>
                      <p className="text-[11px] text-muted-foreground truncate">{app.company} · {app.location}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      <button
                        onClick={(e) => handleOpenJob(app.jobUrl, e)}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                        title="Open job link"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row: Upcoming Follow-ups Checklist */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <div className="mb-4">
          <h2 className="font-bold text-sm tracking-tight text-foreground flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-500" />
            Pending Follow-ups
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Applications in "Applied" status. Best practice is to follow up after 6 days.
          </p>
        </div>

        {stats.upcomingFollowUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 border border-dashed border-border rounded-xl">
            <p className="text-xs text-muted-foreground font-medium">All caught up! No pending follow-ups.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-2">Company</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Applied Date</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-xs">
                {stats.upcomingFollowUps.slice(0, 5).map((app) => {
                  const daysElapsed = Math.floor(
                    (new Date().getTime() - new Date(app.appliedDate).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <tr key={app.id} className="hover:bg-muted/10">
                      <td className="py-2.5 font-semibold text-foreground">{app.company}</td>
                      <td className="py-2.5 text-muted-foreground">{app.title}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {app.appliedDate} 
                        {daysElapsed >= 6 ? (
                          <span className="text-[10px] text-red-500 font-semibold ml-1.5">
                            ({daysElapsed} days ago - Overdue)
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/80 ml-1.5">
                            ({daysElapsed}d ago)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span className="text-[9px] font-semibold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          {app.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={(e) => handleOpenJob(app.jobUrl, e)}
                          className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          Follow Up <ExternalLink size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {stats.upcomingFollowUps.length > 5 && (
              <div className="text-center border-t border-border pt-3">
                <button
                  onClick={() => onViewChange('history')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View all {stats.upcomingFollowUps.length} pending follow-ups
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
