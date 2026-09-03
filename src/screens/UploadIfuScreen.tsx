import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Upload, FileText, X,
  CheckCircle2, ScanLine, Loader2, Circle
} from "lucide-react";
import NavBar from "../components/NavBar";
import type { Screen } from "../App";

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  file: File;
}

type Props = {
  onNavigate: (s: Screen) => void;
  onSetFiles: (current: string, revised: string) => void;
};

type ModalPhase =
  | null
  | { type: 'preprocessing'; step: number }
  | { type: 'preprocessing-complete' }
  | { type: 'analysing'; step: number };

const PRE_STEPS = ['Rendering documents', 'Calibrating resolution', 'Aligning pages'];
const ANALYSIS_STEPS = [
  'Uploading files',
  'Rendering documents',
  'Comparing cover pages & directories',
  'Detecting text, figure & table changes',
  'Classifying findings',
  'Compiling report',
];

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  }
  if (state === 'active') {
    return <Loader2 className="h-3.5 w-3.5 text-[#5b3ecf] animate-spin shrink-0" />;
  }
  return <Circle className="h-3.5 w-3.5 text-slate-200 shrink-0" />;
}

export default function UploadIfuScreen({ onNavigate, onSetFiles }: Props) {
  const [current, setCurrent] = useState<UploadedFile | null>({ name: 'IFU-current.pdf', size: 317195, url: '/ifu/IFU-149990B_test.pdf', file: new File([], 'IFU-current.pdf') });
  const [revised, setRevised] = useState<UploadedFile | null>({ name: 'IFU-revised.pdf', size: 375101, url: '/ifu/IFU-149990C_test.pdf', file: new File([], 'IFU-revised.pdf') });
  const [modalPhase, setModalPhase] = useState<ModalPhase>(null);

  const ready = !!current && !!revised;

  useEffect(() => {
    if (!modalPhase) return;

    if (modalPhase.type === 'preprocessing') {
      if (modalPhase.step < PRE_STEPS.length - 1) {
        const t = setTimeout(() => setModalPhase({ type: 'preprocessing', step: modalPhase.step + 1 }), 900);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setModalPhase({ type: 'preprocessing-complete' }), 900);
        return () => clearTimeout(t);
      }
    }

    if (modalPhase.type === 'analysing') {
      if (modalPhase.step < ANALYSIS_STEPS.length - 1) {
        const t = setTimeout(() => setModalPhase({ type: 'analysing', step: modalPhase.step + 1 }), 600);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => {
          onSetFiles(current?.name || 'IFU-current.pdf', revised?.name || 'IFU-revised.pdf');
          onNavigate('analysis');
        }, 750);
        return () => clearTimeout(t);
      }
    }
  }, [modalPhase, onNavigate, onSetFiles, current, revised]);

  const handleRunComparison = () => {
    if (!ready) return;
    setModalPhase({ type: 'preprocessing', step: 0 });
  };

  const handleContinue = () => {
    if (modalPhase?.type === 'preprocessing-complete') {
      setModalPhase({ type: 'analysing', step: 0 });
    }
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
          <div className="w-full max-w-4xl">
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
                  backgroundColor: ready ? '#5b3ecf' : '#5b3ecf60',
                  cursor: ready ? 'pointer' : 'not-allowed',
                }}
              >
                Run comparison
              </button>
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
          onContinue={handleContinue}
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

  const accentColor = variant === "master" ? "#DC2626" : "#2563EB";

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
  onContinue,
  onReupload,
  currentName,
  revisedName,
}: {
  phase: ModalPhase;
  onContinue: () => void;
  onReupload: () => void;
  currentName: string;
  revisedName: string;
}) {
  if (!phase) return null;

  const isPreprocessing = phase.type === 'preprocessing';
  const isAnalysing = phase.type === 'analysing';
  const isComplete = phase.type === 'preprocessing-complete';

  const currentStep = (isPreprocessing || isAnalysing) ? phase.step : -1;
  const steps = isAnalysing ? ANALYSIS_STEPS : PRE_STEPS;

  const title = isAnalysing ? 'Analysing IFU documents' : 'Verifying IFU documents for Analysis';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[120] bg-black/30 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl shadow-xl p-7 w-[580px] flex flex-col gap-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScanLine className="h-4 w-4 text-[#5b3ecf] animate-spin" style={{ animationDuration: "2.2s" }} />
            <span className="text-xs font-bold tracking-tight uppercase text-[#5b3ecf]">ProofX</span>
          </div>
          <div className="text-lg font-semibold text-[#1A1A2E] mb-2">
            {title}
          </div>
          <p className="text-[11px] text-[#4a3494] leading-relaxed bg-[#f1edff] border border-[#e0d8ff] p-2.5 rounded-lg">
            <strong>Why preprocessing?</strong> We align pages and calibrate resolution so that content, formatting and structural differences are detected with pixel-level accuracy.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Pipeline Status Box */}
          {!isComplete && (
            <div className="border border-slate-200 rounded-lg overflow-hidden border-[#5b3ecf]/20 bg-white">
              <div className="flex items-center gap-3 px-4 py-3 bg-[#F4F2FC]">
                <Loader2 className="animate-spin shrink-0 h-4 w-4 text-[#5b3ecf]" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#5b3ecf] truncate flex items-center gap-1">
                    <span>{currentName}</span>
                    <span className="text-[#8F9CAE] font-normal px-0.5">vs</span>
                    <span>{revisedName}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5b3ecf] shrink-0">
                  PROCESSING
                </span>
              </div>

              <div className="border-t border-[#E0E0E0] px-4 py-3 flex flex-col gap-2 bg-white">
                {/* Upload step */}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span className="text-[11px] leading-none text-[#1A1A2E]">
                    Uploading files
                  </span>
                </div>

                {steps.map((step, i) => {
                  const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
                  return (
                    <div key={step} className="flex items-center gap-2">
                      <StepIcon state={state} />
                      <span className={`text-[11px] leading-none ${
                        state === 'done' ? 'text-[#1A1A2E]'
                        : state === 'active' ? 'text-[#5b3ecf] font-medium'
                        : 'text-[#5F6368]/40'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                onClick={onContinue}
                className="flex-1 py-2.5 rounded-lg bg-[#5b3ecf] text-white text-sm font-semibold hover:bg-[#5b3ecf]/90 active:bg-[#5b3ecf]/80 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="text-xs text-[#5F6368]">Deterministic · No ML · Audit-ready</div>
        </div>
      </div>
    </div>
  );
}
