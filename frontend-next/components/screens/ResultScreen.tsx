'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
  screenClass: string;
  result: { success: boolean; message: string } | null;
}

export function ResultScreen({ screenClass, result }: Props) {
  const success = result?.success ?? true;

  return (
    <main className={`screen state-screen ${screenClass}`} id="resultScreen">
      <section className={`state-card ${success ? 'success' : 'error'}`}>
        <div className="result-icon-ring">
          {success
            ? <CheckCircle size={26} strokeWidth={1.75} />
            : <XCircle size={26} strokeWidth={1.75} />}
        </div>
        <h1>{success ? 'Resume Saved' : 'Save Failed'}</h1>
        <p className="state-subtitle">{result?.message ?? 'Redirecting back...'}</p>
      </section>
    </main>
  );
}
