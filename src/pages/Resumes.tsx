import React, { useState } from 'react';
import { useResumeStore } from '../store/useResumeStore';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  UploadCloud 
} from 'lucide-react';

export default function Resumes() {
  const { resumes, addResume, renameResume, deleteResume, isLoading } = useResumeStore();
  const [newResumeName, setNewResumeName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFileName(file.name);
    // If the resume name text input is empty, pre-fill with the filename (without extension)
    if (!newResumeName) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      // Capitalise and clean up dashes/underscores
      const formatted = nameWithoutExt
        .replace(/[_\-]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      setNewResumeName(formatted);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeName.trim()) return;

    try {
      const fileName = selectedFileName || `${newResumeName.trim().toLowerCase().replace(/\s+/g, '_')}.pdf`;
      await addResume(newResumeName.trim(), fileName);
      setNewResumeName('');
      setSelectedFileName('');
    } catch (err) {
      alert('Error adding resume: ' + err);
    }
  };

  const startRename = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveRename = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await renameResume(id, editingName.trim());
      setEditingId(null);
    } catch (err) {
      alert('Error renaming resume: ' + err);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this resume metadata? This will detach the resume ID from any job applications using it.')) {
      try {
        await deleteResume(id);
      } catch (err) {
        alert('Error deleting resume: ' + err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hidden sm:block">
        <h1 className="text-2xl font-bold tracking-tight">Resume Manager</h1>
        <p className="text-sm text-muted-foreground">Add and manage resume profiles used in your applications.</p>
      </div>

      {/* Add Resume Form */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <h3 className="font-bold text-sm tracking-tight text-foreground mb-4">Add Resume Profile</h3>
        
        <form onSubmit={handleAddResume} className="space-y-4">
          {/* Drag & Drop File Loader */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-muted-foreground bg-background/30'
            }`}
            onClick={() => document.getElementById('resume-file-picker')?.click()}
          >
            <input
              id="resume-file-picker"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud size={28} className="text-muted-foreground" />
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">
                Click to upload or drag & drop
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                PDF, DOCX, or DOC (Only filename metadata is stored)
              </p>
            </div>
            {selectedFileName && (
              <div className="mt-2 text-xs text-primary font-semibold flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <FileText size={12} />
                {selectedFileName}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Give this resume a nickname (e.g. Frontend Engineer - Senior)"
              value={newResumeName}
              onChange={(e) => setNewResumeName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-sm placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="submit"
              disabled={!newResumeName.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus size={16} />
              Add Profile
            </button>
          </div>
        </form>
      </div>

      {/* Resumes List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="font-bold text-sm tracking-tight text-foreground">Stored Resume Profiles</h3>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading resumes...</div>
        ) : resumes.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <FileText size={28} className="text-muted-foreground" />
            <p>No resume profiles added. Add one above to select it when tracking jobs.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {resumes.map((resume) => (
              <div 
                key={resume.id} 
                className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                    <FileText size={18} />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    {editingId === resume.id ? (
                      <div className="flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-1 rounded bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => saveRename(resume.id!)}
                          className="p-1.5 rounded hover:bg-green-500/10 text-green-500"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-bold text-sm text-foreground truncate">{resume.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          File: {resume.fileName} · Uploaded: {new Date(resume.uploadedDate).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {editingId !== resume.id && (
                    <button
                      onClick={() => startRename(resume.id!, resume.name)}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Rename profile"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(resume.id!)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete profile"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
