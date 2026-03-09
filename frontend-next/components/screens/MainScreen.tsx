'use client';

import { FileText, History, RefreshCw, Sparkles } from 'lucide-react';
import type { ResumeOption, HistoryEntry } from '@/types';
import { HistorySidebar } from '@/components/HistorySidebar';

interface Props {
  screenClass: string;

  workflowUrl: string;
  onWorkflowUrlChange: (v: string) => void;
  onWorkflowUrlBlur: () => void;

  resumeOptions: ResumeOption[];
  selectedResume: string;
  onSelectedResumeChange: (v: string) => void;

  jt: string;
  onJtChange: (v: string) => void;
  company: string;
  onCompanyChange: (v: string) => void;
  jd: string;
  onJdChange: (v: string) => void;

  mainStatus: string;
  isLoadingResumes: boolean;
  isGenerating: boolean;

  isHistoryCollapsed: boolean;
  onLoadResumes: () => void;
  onToggleHistory: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;

  historyEntries: HistoryEntry[];
  historyStatus: string;
}

export function MainScreen({
  screenClass,
  workflowUrl,
  onWorkflowUrlChange,
  onWorkflowUrlBlur,
  resumeOptions,
  selectedResume,
  onSelectedResumeChange,
  jt,
  onJtChange,
  company,
  onCompanyChange,
  jd,
  onJdChange,
  mainStatus,
  isLoadingResumes,
  isGenerating,
  isHistoryCollapsed,
  onLoadResumes,
  onToggleHistory,
  onSubmit,
  historyEntries,
  historyStatus,
}: Props) {
  return (
    <main
      id="mainScreen"
      className={`screen ${isHistoryCollapsed ? 'history-collapsed' : ''} ${screenClass}`}
    >
      {/* Top bar */}
      <div className="main-topbar">
        <FileText size={16} color="var(--accent)" />
        <span className="app-title">Resume Optimizer</span>
        <button
          type="button"
          className="secondary"
          style={{ padding: '0.4rem 0.6rem', marginLeft: 'auto' }}
          aria-expanded={!isHistoryCollapsed}
          aria-controls="historySidebar"
          aria-label={isHistoryCollapsed ? 'Show history' : 'Hide history'}
          title="Toggle history sidebar"
          onClick={onToggleHistory}
        >
          <History size={14} />
          {isHistoryCollapsed ? 'History' : 'Hide'}
        </button>
      </div>

      {/* Body */}
      <div className="main-layout">
        <div className="main-form-area">
          <form onSubmit={onSubmit}>
            <div className="form-card">
              <div className="form-card-header">
                <h2>Generate Tailored Resume</h2>
                <p>Paste a job description and let the AI tailor your resume for the role.</p>
              </div>

              <div className="form-fields">
                {/* Webhook URL */}
                <div className="form-field">
                  <label htmlFor="workflowUrl">Workflow Webhook URL</label>
                  <input
                    id="workflowUrl"
                    name="workflowUrl"
                    type="url"
                    placeholder="https://your-n8n-instance.com/webhook/resume-optimize"
                    required
                    value={workflowUrl}
                    onChange={(e) => onWorkflowUrlChange(e.target.value)}
                    onBlur={onWorkflowUrlBlur}
                  />
                </div>

                {/* Base Resume */}
                <div className="form-field">
                  <label htmlFor="selectedResume">Base Resume</label>
                  <div className="inline-controls">
                    <select
                      id="selectedResume"
                      name="selectedResume"
                      required
                      value={selectedResume}
                      onChange={(e) => onSelectedResumeChange(e.target.value)}
                    >
                      {resumeOptions.length === 0 ? (
                        <option value="">— load resumes first —</option>
                      ) : (
                        resumeOptions.map((r) => (
                          <option key={r.name} value={r.name}>
                            [{r.index}] {r.name}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      className="secondary"
                      disabled={isLoadingResumes}
                      onClick={onLoadResumes}
                      title="Refresh resume list"
                    >
                      <RefreshCw size={13} className={isLoadingResumes ? 'spin' : ''} />
                      {isLoadingResumes ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>

                {/* Job Title + Company */}
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="jt">Job Title</label>
                    <input
                      id="jt"
                      name="jt"
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      required
                      value={jt}
                      onChange={(e) => onJtChange(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="company">Company</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="e.g. Acme Corp"
                      required
                      value={company}
                      onChange={(e) => onCompanyChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Job Description */}
                <div className="form-field">
                  <label htmlFor="jd">Job Description</label>
                  <textarea
                    id="jd"
                    name="jd"
                    rows={10}
                    placeholder="Paste the full job description here. Include requirements, responsibilities, and any preferred qualifications..."
                    required
                    value={jd}
                    onChange={(e) => onJdChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <span className="status-text">{mainStatus}</span>
                <button type="submit" disabled={isGenerating}>
                  <Sparkles size={14} />
                  {isGenerating ? 'Generating...' : 'Generate Resume'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <HistorySidebar entries={historyEntries} status={historyStatus} />
      </div>
    </main>
  );
}
