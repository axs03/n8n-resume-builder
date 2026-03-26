export async function apiFetchResumes() {
  return fetch('/resumes/', { method: 'GET' });
}

export async function apiFetchHistory() {
  return fetch(`/applications/?ts=${Date.now()}`, { method: 'GET' });
}

export async function apiCheckWorkflow(url: string) {
  return fetch(url, { method: 'OPTIONS' });
}

export async function apiGenerateResume(
  url: string,
  payload: { jd: string; jt: string; company: string; selectedResume: string },
) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiPreviewResume(payload: {
  company: string;
  jt: string;
  latexContent: string;
}) {
  return fetch('/api/resume-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiSaveResume(payload: {
  company: string;
  jt: string;
  latexContent: string;
}) {
  return fetch('/api/resume-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
