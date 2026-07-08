import React, { useEffect, useState } from 'react';
import { useApplicationStore } from '@/store/useApplicationStore';
import { useResumeStore } from '@/store/useResumeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import Dashboard from '@/pages/Dashboard';
import HistoryPage from '@/pages/History';
import Resumes from '@/pages/Resumes';
import Settings from '@/pages/Settings';
import AddApplicationModal from '@/components/AddApplicationModal';
import { 
  LayoutDashboard, 
  History, 
  FileText, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Maximize2,
  Briefcase,
  Plus
} from 'lucide-react';

type View = 'dashboard' | 'history' | 'resumes' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isPopup, setIsPopup] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadApplications = useApplicationStore((state) => state.loadApplications);
  const loadResumes = useResumeStore((state) => state.loadResumes);
  const { settings, loadSettings, toggleTheme } = useSettingsStore();

  useEffect(() => {
    // Initialise and sync all stores with IndexedDB
    loadApplications();
    loadResumes();
    loadSettings();

    // Check if running in a popup (width <= 500px) or full tab
    const handleResize = () => {
      setIsPopup(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Listen to background broadcasts to dynamically refresh counts
    const handleMessage = (message: any) => {
      if (message.action === 'REFRESH_DATA') {
        loadApplications();
      }
    };
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, [loadApplications, loadResumes, loadSettings]);

  const openFullDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'popup.html' }); // WXT popup opens as popup.html
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} onAddClick={() => setIsAddModalOpen(true)} />;
      case 'history':
        return <HistoryPage />;
      case 'resumes':
        return <Resumes />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewChange={setCurrentView} onAddClick={() => setIsAddModalOpen(true)} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'resumes', label: 'Resumes', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  // --- POPUP COMPACT VIEW LAYOUT ---
  if (isPopup) {
    return (
      <>
        <div className="flex flex-col h-[600px] w-[450px] overflow-hidden bg-background text-foreground font-sans">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shadow-sm select-none">
            <div className="flex items-center gap-2">
              <img src="/icons/icon48.png" className="w-5 h-5 object-contain" alt="JobFlow Logo" />
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                JobFlow
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-1.5 rounded-lg hover:bg-muted text-primary hover:text-primary/80 transition-colors"
                title="Log Job Manually"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Toggle Theme"
              >
                {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={openFullDashboard}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Open Full Dashboard"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-4">
            {renderActiveView()}
          </main>

          {/* Bottom Tab Bar */}
          <nav className="flex justify-around border-t border-border bg-card py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                    isActive 
                      ? 'text-primary scale-105 font-medium' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                  <span className="text-[10px]">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <AddApplicationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      </>
    );
  }

  // --- FULL SCREEN DASHBOARD LAYOUT ---
  return (
    <>
      <div className="flex min-h-screen bg-background text-foreground overflow-hidden font-sans">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0 select-none">
          <div>
            {/* Logo */}
            <div className="px-6 py-6 flex items-center gap-3 border-b border-border">
              <img src="/icons/icon128.png" className="w-8 h-8 object-contain" alt="JobFlow Logo" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                JobFlow
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                    {item.label}
                  </button>
                );
              })}

              <div className="pt-4 border-t border-border/50 mt-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:bg-primary/95 transition-all text-sm"
                >
                  <Plus size={16} />
                  Log Application
                </button>
              </div>
            </nav>
          </div>

          {/* Footer Sidebar Control */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              v1.0.0 (Local Only)
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-secondary hover:bg-muted text-foreground transition-all duration-200 border border-border"
              title="Toggle Theme"
            >
              {settings.theme === 'dark' ? (
                <Sun size={18} className="text-yellow-400 fill-yellow-400" />
              ) : (
                <Moon size={18} className="text-indigo-600 fill-indigo-600" />
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>
      <AddApplicationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
}
