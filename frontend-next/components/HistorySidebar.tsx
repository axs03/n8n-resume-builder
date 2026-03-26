'use client';

import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { HistoryEntry } from '@/types';

interface Props {
  entries: HistoryEntry[];
  status: string;
}

export function HistorySidebar({ entries, status }: Props) {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  return (
    <>
      <aside className="history-sidebar" id="historySidebar" aria-label="Generated resume history">
        <div className="history-header">
          <div>
            <span className="history-header-title">History</span>
            <div className="history-header-status">{status}</div>
          </div>
        </div>

        <ul className="history-list">
          {entries.length === 0 ? (
            <li>
              <div className="history-empty">
                No generated resumes yet.
                <br />
                Submit a job description to get started.
              </div>
            </li>
          ) : (
            entries.map((entry, i) => (
              <li key={i} className="history-item">
                <button
                  type="button"
                  className="history-item-button"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="item-title">{entry.companyName}</div>
                  <div className="item-sub">{entry.jobTitle}</div>
                </button>
                <a
                  className="history-link"
                  href={entry.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open folder
                  <ExternalLink size={11} style={{ marginLeft: 3, verticalAlign: 'middle' }} />
                </a>
              </li>
            ))
          )}
        </ul>
      </aside>

      {selectedEntry ? (
        <div className="history-modal-overlay" role="presentation" onClick={() => setSelectedEntry(null)}>
          <div
            className="history-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Generated resume for ${selectedEntry.companyName} - ${selectedEntry.jobTitle}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <div className="history-modal-title">{selectedEntry.companyName}</div>
                <div className="history-modal-subtitle">{selectedEntry.jobTitle}</div>
              </div>
              <button
                type="button"
                className="ghost history-modal-close"
                aria-label="Close preview"
                onClick={() => setSelectedEntry(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="history-modal-body">
              {selectedEntry.pdfUrl ? (
                <iframe
                  title={`Generated resume ${selectedEntry.companyName} ${selectedEntry.jobTitle}`}
                  src={selectedEntry.pdfUrl}
                  className="history-modal-frame"
                />
              ) : (
                <div className="history-modal-empty">
                  PDF not found for this entry.
                  <a
                    className="history-link"
                    href={selectedEntry.folderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open folder
                    <ExternalLink size={11} style={{ marginLeft: 3, verticalAlign: 'middle' }} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
