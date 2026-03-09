'use client';

import { Loader2 } from 'lucide-react';

interface Props {
  screenClass: string;
  progress: number;
  status: string;
}

export function LoadingScreen({ screenClass, progress, status }: Props) {
  return (
    <main className={`screen state-screen ${screenClass}`} id="loadingScreen">
      <section className="state-card">
        <Loader2 size={28} color="var(--accent)" className="spin" />
        <h1>Generating Resume</h1>
        <p className="state-subtitle">{status}</p>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          style={{ width: '100%' }}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="progress-value">{progress}%</p>
      </section>
    </main>
  );
}
