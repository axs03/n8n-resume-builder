export type ScreenId = 'main' | 'loading' | 'editor' | 'result';
export type TransitionMode = 'slide' | 'fade';
export type StatusBadgeType = 'ok' | 'err' | 'wait';
export type HealthType = 'success' | 'error' | 'pending';

export interface Draft {
  company: string;
  jt: string;
  selectedResume: string;
  latex: string;
  companyPath: string;
  jtPath: string;
}

export interface ResumeOption {
  index: number;
  name: string;
}

export interface HistoryEntry {
  companyName: string;
  jobTitle: string;
  folderUrl: string;
  pdfUrl: string | null;
}
