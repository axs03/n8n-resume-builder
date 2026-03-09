'use client';

import { ExternalLink } from 'lucide-react';
import type { HistoryEntry } from '@/types';

interface Props {
  entries: HistoryEntry[];
  status: string;
}

export function HistorySidebar({ entries }: Props) {
  return (
    <aside className="history-sidebar" id="historySidebar" aria-label="Generated resume history">
      <div className="history-header">
        <span className="history-header-title">History</span>
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
              <div className="item-title">{entry.companyName}</div>
              <div className="item-sub">{entry.jobTitle}</div>
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
  );
}
