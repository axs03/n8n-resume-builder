'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ScreenId,
  TransitionMode,
  Draft,
  ResumeOption,
  HistoryEntry,
  HealthType,
  StatusBadgeType,
} from '@/types';
import {
  normalizeWorkflowUrl,
  sanitizePathPart,
  extractTexFilesFromDirectory,
} from '@/lib/utils';
import {
  apiFetchResumes,
  apiFetchHistory,
  apiCheckWorkflow,
  apiGenerateResume,
  apiPreviewResume,
  apiSaveResume,
} from '@/lib/api';

type ScreenClassMap = Record<ScreenId, string>;

const INITIAL_SCREEN_CLASSES: ScreenClassMap = {
  main: 'is-active',
  loading: '',
  editor: '',
  result: '',
};

export function useResumeApp() {
  // ---- Screen transition state ----
  const [activeScreen, setActiveScreen] = useState<ScreenId>('main');
  const [screenClasses, setScreenClasses] = useState<ScreenClassMap>(INITIAL_SCREEN_CLASSES);
  const activeScreenRef = useRef<ScreenId>('main');
  const transitionLockRef = useRef(false);

  // ---- Health ----
  const [health, setHealth] = useState<{ type: HealthType; text: string }>({
    type: 'pending',
    text: 'Backend · Checking',
  });

  // ---- Main form state ----
  const [workflowUrl, setWorkflowUrl] = useState('');
  const [resumeOptions, setResumeOptions] = useState<ResumeOption[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [jt, setJt] = useState('');
  const [company, setCompany] = useState('');
  const [jd, setJd] = useState('');
  const [mainStatus, setMainStatus] = useState('Ready');
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);

  // ---- History state ----
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyStatus, setHistoryStatus] = useState('Loading generated resumes...');

  // ---- Loading screen state ----
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Preparing request...');
  const progressRef = useRef(0);
  const generationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Editor state ----
  const [draft, setDraft] = useState<Draft | null>(null);
  const [latexContent, setLatexContent] = useState('');
  const [previewSrc, setPreviewSrc] = useState('about:blank');
  const [editorStatus, setEditorStatus] = useState<{ type: StatusBadgeType; text: string }>({
    type: 'wait',
    text: 'No preview yet',
  });
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ---- Result state ----
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Workflow URL refs (for use in stable callbacks) ----
  const workflowUrlRef = useRef('');
  useEffect(() => {
    workflowUrlRef.current = workflowUrl;
  }, [workflowUrl]);

  // ---- Initialize from localStorage ----
  useEffect(() => {
    const saved = localStorage.getItem('resumeWebhookUrl');
    setWorkflowUrl(
      normalizeWorkflowUrl(saved ?? `${window.location.origin}/api/resume-optimize`),
    );
  }, []);

  // ---- Screen transitions ----

  const switchScreen = useCallback((target: ScreenId, mode: TransitionMode = 'slide') => {
    if (transitionLockRef.current) return;
    const from = activeScreenRef.current;
    if (from === target) return;

    transitionLockRef.current = true;
    activeScreenRef.current = target;
    setActiveScreen(target);

    const enterClass = mode === 'fade' ? 'fade-enter' : 'slide-enter';
    const exitClass = mode === 'fade' ? 'fade-exit' : 'slide-exit';

    // Step 1: activate target with enter class
    setScreenClasses((prev) => ({ ...prev, [target]: `is-active ${enterClass}` }));

    // Step 2: RAF to trigger transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setScreenClasses((prev) => ({
          ...prev,
          [target]: 'is-active',
          [from]: exitClass,
        }));

        // Step 3: clean up after animation completes
        setTimeout(() => {
          setScreenClasses((prev) => ({ ...prev, [from]: '' }));
          transitionLockRef.current = false;
        }, 380);
      });
    });
  }, []);

  // ---- Health check ----

  const checkBackendHealth = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setHealth({ type: 'pending', text: 'Backend · Checking' });
    }
    try {
      const url = normalizeWorkflowUrl(
        workflowUrlRef.current || localStorage.getItem('resumeWebhookUrl'),
      );
      const [resumesResult, workflowResult] = await Promise.allSettled([
        fetch('/resumes/', { method: 'GET' }),
        apiCheckWorkflow(url),
      ]);

      const resumesOk = resumesResult.status === 'fulfilled' && resumesResult.value.ok;
      const workflowOk =
        workflowResult.status === 'fulfilled' &&
        workflowResult.value.status >= 200 &&
        workflowResult.value.status < 500;

      setHealth(
        resumesOk && workflowOk
          ? { type: 'success', text: 'Backend · Online' }
          : { type: 'error', text: 'Backend · Offline' },
      );
    } catch {
      setHealth({ type: 'error', text: 'Backend · Offline' });
    }
  }, []);

  // ---- Generation progress helpers ----

  const stopGenerationProgress = useCallback(() => {
    if (generationTimerRef.current) {
      clearInterval(generationTimerRef.current);
      generationTimerRef.current = null;
    }
  }, []);

  const startGenerationProgress = useCallback(() => {
    stopGenerationProgress();
    progressRef.current = 5;
    setLoadingProgress(5);
    setLoadingStatus('Preparing request...');

    generationTimerRef.current = setInterval(() => {
      const current = progressRef.current;
      if (current >= 90) return;

      let next = current + (current < 45 ? 8 : 4);
      if (next > 90) next = 90;

      let statusText = 'Generating tailored draft...';
      if (next >= 70) statusText = 'Finalizing draft content...';
      else if (next >= 35) statusText = 'Analyzing role and resume context...';

      progressRef.current = next;
      setLoadingProgress(next);
      setLoadingStatus(statusText);
    }, 600);
  }, [stopGenerationProgress]);

  const finishGenerationProgress = useCallback(async () => {
    stopGenerationProgress();
    progressRef.current = 100;
    setLoadingProgress(100);
    setLoadingStatus('Generation complete. Opening review...');
    await new Promise((r) => setTimeout(r, 320));
  }, [stopGenerationProgress]);

  // ---- Load resume options ----

  const loadResumeOptions = useCallback(async () => {
    setIsLoadingResumes(true);
    setMainStatus('Loading resume options...');
    try {
      const response = await apiFetchResumes();
      const body = await response.text();

      if (!response.ok) {
        setMainStatus(`Could not load base resumes (${response.status}). Please try again.`);
        setResumeOptions([]);
        return;
      }

      const resumes = extractTexFilesFromDirectory(body);
      setResumeOptions(resumes);

      if (resumes.length === 0) {
        setMainStatus('No base resumes are available yet. Add .tex files to Resume/Base.');
      } else {
        setSelectedResume((prev) => (prev && resumes.some((r) => r.name === prev) ? prev : resumes[0]?.name ?? ''));
        setMainStatus(`Loaded ${resumes.length} resume option${resumes.length === 1 ? '' : 's'}.`);
      }
    } catch {
      setMainStatus('Unable to load base resumes right now. Check the service and retry.');
      setResumeOptions([]);
    } finally {
      setIsLoadingResumes(false);
      checkBackendHealth();
    }
  }, [checkBackendHealth]);

  // ---- Load history ----

  const loadHistoryEntries = useCallback(async () => {
    setHistoryStatus('Loading generated resumes...');
    try {
      const response = await apiFetchHistory();

      if (!response.ok) {
        setHistoryEntries([]);
        setHistoryStatus('History is empty.');
        return;
      }

      const payload = await response.json();
      const entries: HistoryEntry[] = Array.isArray(payload?.entries) ? payload.entries : [];
      setHistoryEntries(entries);
      setHistoryStatus(
        entries.length
          ? `${entries.length} generated resume ${entries.length === 1 ? 'entry' : 'entries'}.`
          : 'History is empty.',
      );
    } catch {
      setHistoryEntries([]);
      setHistoryStatus('History unavailable.');
    }
  }, []);

  // ---- Reset / back to main ----

  const clearMainForm = useCallback(() => {
    setJt('');
    setCompany('');
    setJd('');
    setSelectedResume('');
    setResumeOptions([]);
    setLatexContent('');
    setPreviewSrc('about:blank');
    const url = normalizeWorkflowUrl(localStorage.getItem('resumeWebhookUrl'));
    setWorkflowUrl(url);
  }, []);

  const backToMain = useCallback(
    ({
      clearForm = false,
      refreshHistory = false,
      transition = 'slide' as TransitionMode,
    } = {}) => {
      switchScreen('main', transition);

      if (clearForm) {
        setDraft(null);
        clearMainForm();
        setMainStatus('Ready for next resume generation.');
        loadResumeOptions();
      }

      if (refreshHistory) {
        loadHistoryEntries();
      }
    },
    [switchScreen, clearMainForm, loadResumeOptions, loadHistoryEntries],
  );

  // ---- Show save result ----

  const showSaveResult = useCallback(
    (result: { success: boolean; message: string }) => {
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
        resultTimerRef.current = null;
      }
      setSaveResult(result);
      switchScreen('result', 'slide');

      resultTimerRef.current = setTimeout(() => {
        backToMain({ clearForm: true, refreshHistory: true, transition: 'fade' });
      }, 2200);
    },
    [switchScreen, backToMain],
  );

  // ---- Form submit ----

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsGenerating(true);

      const url = normalizeWorkflowUrl(workflowUrlRef.current);
      localStorage.setItem('resumeWebhookUrl', url);
      setWorkflowUrl(url);
      workflowUrlRef.current = url;

      switchScreen('loading', 'slide');
      startGenerationProgress();

      const payload = {
        jd: jd.trim(),
        jt: jt.trim(),
        company: company.trim(),
        selectedResume: selectedResume.trim(),
      };

      try {
        const response = await apiGenerateResume(url, payload);
        const contentType = response.headers.get('content-type') ?? '';
        const body = contentType.includes('application/json')
          ? await response.json()
          : await response.text();

        if (!response.ok) {
          stopGenerationProgress();
          switchScreen('main', 'fade');
          setMainStatus(`Draft generation failed (${response.status}). Please try again.`);
          return;
        }

        const latex = String((body as { draftLatex?: string })?.draftLatex ?? '');

        if (!latex) {
          stopGenerationProgress();
          switchScreen('main', 'fade');
          setMainStatus('No draft content was returned.');
          return;
        }

        await finishGenerationProgress();

        const newDraft: Draft = {
          company: payload.company,
          jt: payload.jt,
          selectedResume: payload.selectedResume,
          latex,
          companyPath: sanitizePathPart(payload.company),
          jtPath: sanitizePathPart(payload.jt),
        };

        setDraft(newDraft);
        setLatexContent(latex);
        setPreviewSrc('about:blank');
        setEditorStatus({ type: 'wait', text: 'Review the LaTeX, then compile preview.' });
        switchScreen('editor', 'slide');
      } catch {
        stopGenerationProgress();
        switchScreen('main', 'fade');
        setMainStatus(
          'Unable to reach the workflow endpoint. Verify the webhook URL and try again.',
        );
      } finally {
        setIsGenerating(false);
        checkBackendHealth();
      }
    },
    [
      jt,
      company,
      jd,
      selectedResume,
      switchScreen,
      startGenerationProgress,
      stopGenerationProgress,
      finishGenerationProgress,
      checkBackendHealth,
    ],
  );

  // ---- Preview ----

  const handlePreview = useCallback(async () => {
    if (!draft) return;
    setIsPreviewing(true);
    setEditorStatus({ type: 'wait', text: 'Compiling preview...' });

    try {
      const response = await apiPreviewResume({
        company: draft.company,
        jt: draft.jt,
        latexContent,
      });
      const contentType = response.headers.get('content-type') ?? '';
      const body = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        setEditorStatus({ type: 'err', text: `Preview failed (${response.status})` });
        return;
      }

      const url = String((body as { previewUrl?: string })?.previewUrl ?? '');
      if (url) {
        setPreviewSrc(`${window.location.origin}${url}`);
        setEditorStatus({ type: 'ok', text: 'Preview compiled successfully.' });
      } else {
        setEditorStatus({ type: 'wait', text: 'Preview compiled, but no preview URL was returned.' });
      }
    } catch {
      setEditorStatus({ type: 'err', text: 'Preview request failed' });
    } finally {
      setIsPreviewing(false);
      checkBackendHealth();
    }
  }, [draft, latexContent, checkBackendHealth]);

  // ---- Save ----

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setIsSaving(true);
    setEditorStatus({ type: 'wait', text: 'Saving final resume...' });

    try {
      const response = await apiSaveResume({
        company: draft.company,
        jt: draft.jt,
        latexContent,
      });

      if (!response.ok) {
        setEditorStatus({ type: 'err', text: `Save failed (${response.status})` });
        showSaveResult({ success: false, message: 'Resume save failed. Redirecting to main screen...' });
        return;
      }

      setEditorStatus({ type: 'ok', text: 'Saved successfully.' });
      showSaveResult({ success: true, message: 'Resume saved successfully. Redirecting to main screen...' });
    } catch {
      setEditorStatus({ type: 'err', text: 'Save request failed' });
      showSaveResult({
        success: false,
        message: 'Unable to save resume right now. Redirecting to main screen...',
      });
    } finally {
      setIsSaving(false);
      checkBackendHealth();
    }
  }, [draft, latexContent, showSaveResult, checkBackendHealth]);

  // ---- Misc handlers ----

  const handleWorkflowUrlBlur = useCallback(() => {
    setWorkflowUrl((prev) => normalizeWorkflowUrl(prev));
  }, []);

  const toggleHistory = useCallback(() => {
    setIsHistoryCollapsed((prev) => !prev);
  }, []);

  // ---- Mount: initial loads + periodic health check ----

  const loadResumeOptionsRef = useRef(loadResumeOptions);
  const loadHistoryEntriesRef = useRef(loadHistoryEntries);
  const checkBackendHealthRef = useRef(checkBackendHealth);

  useEffect(() => {
    loadResumeOptionsRef.current = loadResumeOptions;
    loadHistoryEntriesRef.current = loadHistoryEntries;
    checkBackendHealthRef.current = checkBackendHealth;
  });

  useEffect(() => {
    loadResumeOptionsRef.current();
    loadHistoryEntriesRef.current();
    checkBackendHealthRef.current();
    const interval = setInterval(() => checkBackendHealthRef.current({ silent: true }), 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    // Screen
    screenClasses,
    activeScreen,

    // Health
    health,

    // Main form
    workflowUrl,
    setWorkflowUrl,
    resumeOptions,
    selectedResume,
    setSelectedResume,
    jt,
    setJt,
    company,
    setCompany,
    jd,
    setJd,
    mainStatus,
    isLoadingResumes,
    isGenerating,
    isHistoryCollapsed,
    handleWorkflowUrlBlur,
    toggleHistory,
    loadResumeOptions,
    handleSubmit,

    // History
    historyEntries,
    historyStatus,

    // Loading
    loadingProgress,
    loadingStatus,

    // Editor
    draft,
    latexContent,
    setLatexContent,
    previewSrc,
    editorStatus,
    isPreviewing,
    isSaving,
    handlePreview,
    handleSave,
    backToMain,

    // Result
    saveResult,
  };
}
