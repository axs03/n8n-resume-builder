'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Eye, AlertTriangle, FileCode2 } from 'lucide-react';
import type { StatusBadgeType } from '@/types';

interface LatexError {
  line?: number;
  message: string;
}

/** Lightweight client-side LaTeX syntax checker */
function validateLatex(src: string): LatexError[] {
  const errors: LatexError[] = [];
  const lines = src.split('\n');

  let braceDepth = 0;
  let bracketDepth = 0;
  let mathInline = 0; // count of unmatched single $
  let hasDocumentClass = false;
  let hasBeginDocument = false;
  let hasEndDocument = false;

  for (let i = 0; i < lines.length; i++) {
    const ln = i + 1;
    const line = lines[i];

    if (/\\documentclass/.test(line)) hasDocumentClass = true;
    if (/\\begin\{document\}/.test(line)) hasBeginDocument = true;
    if (/\\end\{document\}/.test(line)) hasEndDocument = true;

    // Count braces (skip escaped)
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '\\') { j++; continue; }
      if (ch === '%') break; // rest is comment
      if (ch === '{') braceDepth++;
      if (ch === '}') {
        braceDepth--;
        if (braceDepth < 0) {
          errors.push({ line: ln, message: 'Unexpected closing brace `}`' });
          braceDepth = 0;
        }
      }
      if (ch === '[') bracketDepth++;
      if (ch === ']') bracketDepth--;
      // Inline math: count unescaped single $
      if (ch === '$' && line[j + 1] !== '$') mathInline++;
    }

    // Detect \begin without matching \end on same nesting (simple scan)
    const beginMatch = line.match(/\\begin\{([^}]+)\}/g);
    const endMatch = line.match(/\\end\{([^}]+)\}/g);
    if (beginMatch && !endMatch && /\\end/.test(src) === false) {
      // skip – would need full document context
    }

    // Warn about double backslash at end of line inside preamble
    if (/^\\\\$/.test(line.trim())) {
      errors.push({ line: ln, message: 'Stray `\\\\` on its own line' });
    }
  }

  if (braceDepth > 0) errors.push({ message: `${braceDepth} unclosed brace(s) \`{\`` });
  if (bracketDepth < 0) errors.push({ message: `Unmatched closing bracket \`]\`` });
  if (mathInline % 2 !== 0) errors.push({ message: 'Unmatched inline math delimiter `$`' });
  if (src.trim() && !hasDocumentClass) errors.push({ message: 'Missing \\documentclass declaration' });
  if (hasBeginDocument && !hasEndDocument) errors.push({ message: 'Missing \\end{document}' });

  return errors;
}

interface Props {
  screenClass: string;
  draftMeta: string;
  latexContent: string;
  onLatexChange: (v: string) => void;
  previewSrc: string;
  editorStatus: { type: StatusBadgeType; text: string };
  isPreviewing: boolean;
  isSaving: boolean;
  onPreview: () => void;
  onSave: () => void;
  onBack: () => void;
}

export function EditorScreen({
  screenClass,
  draftMeta,
  latexContent,
  onLatexChange,
  previewSrc,
  editorStatus,
  isPreviewing,
  isSaving,
  onPreview,
  onSave,
  onBack,
}: Props) {
  const [latexErrors, setLatexErrors] = useState<LatexError[]>([]);

  // Debounced validation on content change
  useEffect(() => {
    if (!latexContent.trim()) {
      setLatexErrors([]);
      return;
    }
    const timer = setTimeout(() => {
      setLatexErrors(validateLatex(latexContent));
    }, 400);
    return () => clearTimeout(timer);
  }, [latexContent]);

  const hasPreview = previewSrc && previewSrc !== 'about:blank';

  return (
    <main id="editorScreen" className={`screen ${screenClass}`}>
      {/* Top bar */}
      <div className="editor-topbar">
        <button type="button" className="ghost" onClick={onBack} title="Back to main">
          <ArrowLeft size={15} />
        </button>

        <div className="meta">
          <div className="meta-title">LaTeX Editor</div>
          {draftMeta && <div className="meta-sub">{draftMeta}</div>}
        </div>

        <div className="actions">
          <span className={`status-badge ${editorStatus.type}`}>{editorStatus.text}</span>
          <button
            type="button"
            className="secondary"
            disabled={isPreviewing}
            onClick={onPreview}
            title="Compile and preview"
          >
            <Eye size={13} />
            {isPreviewing ? 'Compiling…' : 'Compile'}
          </button>
          <button type="button" disabled={isSaving} onClick={onSave} title="Approve and save">
            <Save size={13} />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor body: PDF left | LaTeX code right */}
      <div className="editor-body">
        {/* PDF Preview pane */}
        <div className="editor-pane">
          <div className="pane-header">
            <span className="pane-title">Preview</span>
          </div>
          <div className="pane-body">
            {hasPreview ? (
              <iframe
                id="previewFrame"
                className="preview-frame"
                title="Resume PDF preview"
                src={previewSrc}
              />
            ) : (
              <div className="preview-blank">
                <FileCode2 size={32} />
                <span>Compile to see a preview</span>
              </div>
            )}
          </div>
        </div>

        {/* LaTeX editor pane */}
        <div className="editor-pane">
          <div className="pane-header">
            <span className="pane-title">LaTeX Source</span>
            {latexErrors.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--err)' }}>
                <AlertTriangle size={11} />
                {latexErrors.length} issue{latexErrors.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="pane-body">
            <textarea
              id="latexEditor"
              value={latexContent}
              onChange={(e) => onLatexChange(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="\documentclass{article}..."
            />
          </div>

          {latexErrors.length > 0 && (
            <div className="latex-errors-panel">
              <div className="latex-errors-label">
                <AlertTriangle size={10} />
                Syntax issues
              </div>
              {latexErrors.map((err, i) => (
                <div key={i} className="latex-error-item">
                  {err.line != null && (
                    <span className="latex-error-loc">L{err.line}</span>
                  )}
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
