'use client';

import { useResumeApp } from '@/hooks/useResumeApp';
import { HealthIndicator } from '@/components/HealthIndicator';
import { MainScreen } from '@/components/screens/MainScreen';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { EditorScreen } from '@/components/screens/EditorScreen';
import { ResultScreen } from '@/components/screens/ResultScreen';

export default function Page() {
  const app = useResumeApp();

  const draftMeta = app.draft
    ? `${app.draft.company} • ${app.draft.jt} • ${app.draft.selectedResume}`
    : '';

  return (
    <>
      <HealthIndicator type={app.health.type} text={app.health.text} />

      <div id="screenViewport">
        <MainScreen
          screenClass={app.screenClasses.main}
          workflowUrl={app.workflowUrl}
          onWorkflowUrlChange={app.setWorkflowUrl}
          onWorkflowUrlBlur={app.handleWorkflowUrlBlur}
          resumeOptions={app.resumeOptions}
          selectedResume={app.selectedResume}
          onSelectedResumeChange={app.setSelectedResume}
          jt={app.jt}
          onJtChange={app.setJt}
          company={app.company}
          onCompanyChange={app.setCompany}
          jd={app.jd}
          onJdChange={app.setJd}
          mainStatus={app.mainStatus}
          isLoadingResumes={app.isLoadingResumes}
          isGenerating={app.isGenerating}
          isHistoryCollapsed={app.isHistoryCollapsed}
          onLoadResumes={app.loadResumeOptions}
          onToggleHistory={app.toggleHistory}
          onSubmit={app.handleSubmit}
          historyEntries={app.historyEntries}
          historyStatus={app.historyStatus}
        />

        <LoadingScreen
          screenClass={app.screenClasses.loading}
          progress={app.loadingProgress}
          status={app.loadingStatus}
        />

        <EditorScreen
          screenClass={app.screenClasses.editor}
          draftMeta={draftMeta}
          latexContent={app.latexContent}
          onLatexChange={app.setLatexContent}
          previewSrc={app.previewSrc}
          editorStatus={app.editorStatus}
          isPreviewing={app.isPreviewing}
          isSaving={app.isSaving}
          onPreview={app.handlePreview}
          onSave={app.handleSave}
          onBack={() => app.backToMain({ clearForm: true, transition: 'slide' })}
        />

        <ResultScreen
          screenClass={app.screenClasses.result}
          result={app.saveResult}
        />
      </div>
    </>
  );
}
