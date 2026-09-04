import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Upload, FileText, X,
  CheckCircle2, ScanLine, Loader2, Circle
} from "lucide-react";
import NavBar from "../components/NavBar";
import RecentRunsTable, { type RunRow } from "../components/RecentRunsTable";
import type { Screen } from "../App";

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  file: File;
}

type Props = {
  onNavigate: (s: Screen) => void;
  onSetFiles: (current: string, revised: string, bulk?: boolean) => void;
  onSetLrfFlowActive?: (active: boolean) => void;
  onSetIfuFlowActive?: (active: boolean) => void;
};

const ifuRuns: RunRow[] = [
  { datetime: 'Aug 1, 2026, 09:38 AM', master: 'IFU-current.pdf', revised: 'IFU-revised.pdf', mode: 'SINGLE', pairs: 1, skipped: 0, findings: 11, workflow: 'DOCUMENT COMPARISON', status: 'PASS' },
  { datetime: 'Aug 3, 2026, 03:24 PM', master: 'IFU-current.pdf', revised: 'IFU-revised.pdf', mode: 'SINGLE', pairs: 1, skipped: 0, findings: 9, workflow: 'DOCUMENT COMPARISON', status: 'PASS' },
  { datetime: 'Jul 30, 2026, 04:05 PM', master: 'IFU-149990B_test.pdf', revised: 'IFU-149990C_test.pdf', mode: 'SINGLE', pairs: 1, skipped: 0, findings: 82, workflow: 'DOCUMENT COMPARISON', status: 'PASS' },
]

type ModalPhase =
  | null
  | { type: 'running'; step: number }
  | { type: 'complete' };

// Pipeline steps and their (mock) elapsed times — the pipeline that runs when comparing two IFUs
const STEPS = [
  'Parse PDFs',
  'Cover-page identity sanity gate',
  'Language-set + directory checks',
  'Text diff (sentence matching)',
  'Representation-change probe (image/table ↔ live text)',
  'Figure diff (incl. WYSIWYG render)',
  'Table diff',
  'Matrix code diff (DataMatrix / QR / ...)',
  'Classification',
  'Write Excel report',
  'Annotate PDFs',
  'Write PDF report',
];
const STEP_DURATIONS = [795.70, 0.00, 0.29, 0.49, 3.74, 1.53, 2.24, 0.68, 0.15, 1.08, 4.32, 0.71];

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  }
  if (state === 'active') {
    return <Loader2 className="h-3.5 w-3.5 text-[#475569] animate-spin shrink-0" />;
  }
  return <Circle className="h-3.5 w-3.5 text-slate-200 shrink-0" />;
}

export default function UploadIfuScreen({ onNavigate, onSetFiles, onSetLrfFlowActive, onSetIfuFlowActive }: Props) {
  const [current, setCurrent] = useState<UploadedFile | null>({ name: 'IFU-current.pdf', size: 317195, url: '/ifu/IFU-149990B_test.pdf', file: new File([], 'IFU-current.pdf') });
  const [revised, setRevised] = useState<UploadedFile | null>({ name: 'IFU-revised.pdf', size: 375101, url: '/ifu/IFU-149990C_test.pdf', file: new File([], 'IFU-revised.pdf') });
  const [modalPhase, setModalPhase] = useState<ModalPhase>(null);

  const ready = !!current && !!revised;

  useEffect(() => {
    if (!modalPhase || modalPhase.type !== 'running') return;
    if (modalPhase.step < STEPS.length - 1) {
      const t = setTimeout(() => setModalPhase({ type: 'running', step: modalPhase.step + 1 }), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setModalPhase({ type: 'complete' }), 450);
    return () => clearTimeout(t);
  }, [modalPhase]);

  const handleRunComparison = () => {
    if (!ready) return;
    setModalPhase({ type: 'running', step: 0 });
  };

  const handleViewFindings = () => {
    onSetFiles(current?.name || 'IFU-current.pdf', revised?.name || 'IFU-revised.pdf');
    onNavigate('analysis');
  };

  const handleReupload = () => {
    setModalPhase(null);
  };

  return (
    <>
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col" style={{ opacity: modalPhase ? 0.45 : 1 }}>
        <NavBar
          showBack
          onBack={() => onNavigate('proofreader-dashboard')}
          steps={[
            { label: 'Upload IFUs', active: true },
            { label: 'Analysis' },
          ]}
          showProfile
          onProfileClick={() => onNavigate('profile')}
          onLogout={() => onNavigate('login')}
          profileName="Athmika"
          profileInitials="A"
        />

        <main className="flex-1 flex items-start justify-center px-6 py-16">
          <div className="w-full max-w-6xl">
            <div className="w-full max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h1 className="text-[28px] font-semibold tracking-tight text-[#1C2E59] mb-2">
                  Compare IFUs
                </h1>
                <p className="text-sm text-gray-500">
                  Upload a current and revised IFU document to identify text, figure, table and formatting differences.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DropZone label="Current IFU Document" file={current} onFile={setCurrent} onClear={() => setCurrent(null)} variant="master" />
                <DropZone label="Revised IFU Document" file={revised} onFile={setRevised} onClear={() => setRevised(null)} variant="revised" />
              </div>

              {/* Run comparison button */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  onClick={handleRunComparison}
                  disabled={!ready}
                  className="px-8 py-2.5 rounded-lg text-sm font-bold text-white transition-all cursor-pointer"
                  style={{
                    backgroundColor: ready ? '#1C2E59' : '#1C2E5960',
                    cursor: ready ? 'pointer' : 'not-allowed',
                  }}
                >
                  Run comparison
                </button>
              </div>
            </div>

            <div className="mt-14">
              <RecentRunsTable
                title="Recent IFU Runs"
                runs={ifuRuns}
                showLangCount
                historyScreen="proofreader-history"
                csvFileName="proofx-ifu-runs.csv"
                onNavigate={onNavigate}
                onSetFiles={onSetFiles}
                onSetLrfFlowActive={onSetLrfFlowActive}
                onSetIfuFlowActive={onSetIfuFlowActive}
              />
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs shrink-0">
          Deterministic · No ML · Audit-ready
        </footer>
      </div>

      {/* Processing Modal Overlay */}
      {modalPhase && (
        <ProcessingModal
          phase={modalPhase}
          onViewFindings={handleViewFindings}
          onReupload={handleReupload}
          currentName={current?.name ?? 'IFU-current.pdf'}
          revisedName={revised?.name ?? 'IFU-revised.pdf'}
        />
      )}
    </>
  );
}

// ── DropZone Component ──────────────────────────────────────────────────────
function DropZone({
  label, file, onFile, onClear, variant = "master",
}: {
  label: string;
  file: UploadedFile | null;
  onFile: (f: UploadedFile) => void;
  onClear: () => void;
  variant?: "master" | "revised";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    onFile({ name: f.name, size: f.size, url: URL.createObjectURL(f), file: f });
  };

  const accentColor = variant === "master" ? "#475569" : "#2563EB";

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
        <div className="text-xs font-medium uppercase tracking-wide" style={{ color: accentColor }}>{label}</div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => { e.preventDefault(); setHover(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="bg-white border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors h-36"
        style={{ borderColor: hover ? accentColor : undefined, borderLeft: `3px solid ${accentColor}` }}
      >
        <Upload className="h-6 w-6 mb-2 text-gray-400" />
        <div className="text-sm font-semibold text-gray-700">Add file</div>
        <div className="text-xs text-gray-400 mt-0.5">PDF or Word</div>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,application/pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {file && (
        <div className="flex items-center gap-3 px-3 py-2.5 mt-3 border border-gray-200 rounded-lg bg-white">
          <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
            <FileText className="h-4 w-4" style={{ color: accentColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">
              {file.name}
            </div>
            <div className="text-[10px] text-gray-400">
              {file.name === 'IFU-current.pdf' ? '309.8 KB · 2 pages'
                : file.name === 'IFU-revised.pdf' ? '366.3 KB · 3 pages'
                : `${formatBytes(file.size)}`}
            </div>
          </div>
          <button onClick={onClear} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer" aria-label="Remove">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared Helpers ──────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function ProcessingModal({
  phase,
  onViewFindings,
  onReupload,
  currentName,
  revisedName,
}: {
  phase: ModalPhase;
  onViewFindings: () => void;
  onReupload: () => void;
  currentName: string;
  revisedName: string;
}) {
  if (!phase) return null;

  const isComplete = phase.type === 'complete';
  const currentStep = phase.type === 'running' ? phase.step : STEPS.length;

  const title = isComplete ? 'Proofreading completed' : 'Comparing documents…';
  const subtitle = isComplete
    ? 'All steps finished — review the findings whenever you\'re ready.'
    : 'This can take a while for large IFUs — the pipeline runs OCR, layout, text, figure, table, and matrix-code diffing in sequence.';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[120] bg-black/30 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl shadow-xl p-7 w-[580px] flex flex-col gap-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <ScanLine className="h-4 w-4 text-[#475569] animate-spin" style={{ animationDuration: "2.2s" }} />
            )}
            <span className="text-xs font-bold tracking-tight uppercase text-[#475569]">ProofX</span>
          </div>
          <div className="text-lg font-semibold text-[#1A1A2E] mb-2">
            {title}
          </div>
          <p className="text-[11px] text-[#334155] leading-relaxed bg-[#F1F5F9] border border-[#CBD5E1] p-2.5 rounded-lg">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Pipeline Status Box */}
          <div className="border border-slate-200 rounded-lg overflow-hidden border-[#475569]/20 bg-white">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#F4F2FC]">
              {isComplete ? (
                <CheckCircle2 className="shrink-0 h-4 w-4 text-green-500" />
              ) : (
                <Loader2 className="animate-spin shrink-0 h-4 w-4 text-[#475569]" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#475569] truncate flex items-center gap-1">
                  <span>{currentName}</span>
                  <span className="text-[#8F9CAE] font-normal px-0.5">vs</span>
                  <span>{revisedName}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] shrink-0">
                {isComplete ? 'DONE' : 'PROCESSING'}
              </span>
            </div>

            <div className="border-t border-[#E0E0E0] px-4 py-3 flex flex-col gap-2 bg-white max-h-72 overflow-y-auto">
              {STEPS.map((step, i) => {
                const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
                return (
                  <div key={step} className="flex items-center gap-2">
                    <StepIcon state={state} />
                    <span className={`text-[11px] leading-none flex-1 ${
                      state === 'done' ? 'text-[#1A1A2E]'
                      : state === 'active' ? 'text-[#475569] font-medium'
                      : 'text-[#5F6368]/40'
                    }`}>
                      {step}
                    </span>
                    {state === 'done' && (
                      <span className="text-[11px] text-[#5F6368] tabular-nums">
                        {STEP_DURATIONS[i].toFixed(2)}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          {isComplete && (
            <div className="flex gap-3 mt-1">
              <button
                onClick={onReupload}
                className="flex-1 py-2.5 rounded-lg border border-[#E0E0E0] text-sm font-semibold hover:bg-[#F1F3F4] active:bg-[#F1F3F4]/80 transition-colors text-[#1A1A2E] cursor-pointer"
              >
                Re-upload
              </button>
              <button
                onClick={onViewFindings}
                className="flex-1 py-2.5 rounded-lg bg-[#475569] text-white text-sm font-semibold hover:bg-[#475569]/90 active:bg-[#475569]/80 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                View Findings <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="text-xs text-[#5F6368]">Deterministic · No ML · Audit-ready</div>
        </div>
      </div>
    </div>
  );
}
