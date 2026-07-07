import React from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useApplicationStore } from '../store/useApplicationStore';
import { useResumeStore } from '../store/useResumeStore';
import { 
  Save, 
  Trash2, 
  Download, 
  Bell, 
  Target, 
  ShieldAlert, 
  CheckCircle,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettingsStore();
  const { applications, clearAll: clearApps } = useApplicationStore();
  const { resumes } = useResumeStore();

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      updateSettings({ dailyGoal: val });
    }
  };

  const handleNotificationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ notificationsEnabled: e.target.checked });
  };

  const handleExportJSON = () => {
    try {
      const exportData = {
        applications,
        resumes,
        settings,
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `jobflow_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error exporting JSON: ' + err);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        'ID',
        'Company',
        'Title',
        'Location',
        'Job URL',
        'Employment Type',
        'Work Mode',
        'Portal',
        'Resume Nickname',
        'Status',
        'Applied Date',
        'Applied Time',
        'Notes',
        'Reminder Sent',
        'Tracked Date',
      ];

      const csvRows = [headers.join(',')];

      applications.forEach((app) => {
        const row = [
          app.id || '',
          `"${app.company.replace(/"/g, '""')}"`,
          `"${app.title.replace(/"/g, '""')}"`,
          `"${(app.location || '').replace(/"/g, '""')}"`,
          `"${app.jobUrl.replace(/"/g, '""')}"`,
          `"${app.employmentType}"`,
          `"${app.workMode}"`,
          `"${app.portal}"`,
          `"${(app.resumeName || '').replace(/"/g, '""')}"`,
          `"${app.status}"`,
          `"${app.appliedDate}"`,
          `"${app.appliedTime || ''}"`,
          `"${(app.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
          app.reminderSent ? 'TRUE' : 'FALSE',
          `"${app.createdAt}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `jobflow_applications_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error exporting CSV: ' + err);
    }
  };

  const handleFactoryReset = async () => {
    const confirmation = confirm(
      'WARNING: You are about to clear all tracked applications, resume profiles, and settings. This action is permanent and cannot be undone.\n\nType "RESET" to confirm:'
    );

    if (confirmation) {
      const response = prompt('Please re-type "RESET" to complete the deletion:');
      if (response === 'RESET') {
        try {
          await clearApps();
          // Reload page to re-initialise default configurations
          window.location.reload();
        } catch (err) {
          alert('Error performing factory reset: ' + err);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hidden sm:block">
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure thresholds, alerts, and manage backup data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Goals & Preferences */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-5">
          <h3 className="font-bold text-sm tracking-tight text-foreground flex items-center gap-2">
            <Target size={16} className="text-primary" />
            Preferences
          </h3>

          {/* Goal Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Daily Application Goal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="50"
                value={settings.dailyGoal}
                onChange={handleGoalChange}
                className="w-24 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
              />
              <span className="text-xs text-muted-foreground">applications per day</span>
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Updates the dashboard progress circle metric to track consistency.
            </p>
          </div>

          {/* Notification Checkbox */}
          <div className="flex items-start gap-3 border-t border-border/50 pt-4">
            <div className="flex items-center h-5">
              <input
                id="notifications-toggle"
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={handleNotificationToggle}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary bg-background cursor-pointer"
              />
            </div>
            <div className="text-xs">
              <label htmlFor="notifications-toggle" className="font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                <Bell size={14} className="text-primary" />
                Enable 6-Day Follow-Up Reminders
              </label>
              <p className="text-[11px] text-muted-foreground/80 mt-1 leading-relaxed">
                When enabled, JobFlow creates browser alarms to notify you of follow-ups on jobs left in "Applied" status after 6 days.
              </p>
            </div>
          </div>
        </div>

        {/* Data Portability */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-sm tracking-tight text-foreground flex items-center gap-2">
              <Download size={16} className="text-primary" />
              Backup & Export
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export your application history for analysis in spreadsheet applications or to migrate to another device.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* CSV Export */}
              <button
                onClick={handleExportCSV}
                disabled={applications.length === 0}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-background/50 hover:bg-muted/50 transition-all text-center gap-2 group disabled:opacity-50 disabled:hover:bg-background/50"
              >
                <div className="p-2 bg-green-500/10 rounded-xl text-green-500 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <span className="text-xs font-semibold block">Export CSV</span>
                  <span className="text-[10px] text-muted-foreground">For Excel / Sheets</span>
                </div>
              </button>

              {/* JSON Export */}
              <button
                onClick={handleExportJSON}
                disabled={applications.length === 0}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-background/50 hover:bg-muted/50 transition-all text-center gap-2 group disabled:opacity-50 disabled:hover:bg-background/50"
              >
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 group-hover:scale-110 transition-transform">
                  <FileJson size={20} />
                </div>
                <div>
                  <span className="text-xs font-semibold block">Backup JSON</span>
                  <span className="text-[10px] text-muted-foreground">Includes settings/resumes</span>
                </div>
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-muted-foreground/70 mt-4">
            Data format: CSV includes application rows. JSON preserves database integrity.
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card p-5 rounded-2xl border border-red-500/30 bg-red-500/[0.02] shadow-sm">
        <h3 className="font-bold text-sm tracking-tight text-red-500 flex items-center gap-2 mb-2">
          <ShieldAlert size={18} />
          Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Permanently clear all data inside the JobFlow extension. This will purge all local IndexedDB tables (applications, resumes, and preferences) and cancel all alarms.
        </p>

        <button
          onClick={handleFactoryReset}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Trash2 size={14} />
          Factory Reset Data
        </button>
      </div>
    </div>
  );
}
