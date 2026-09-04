import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Upload, FileText, X,
  CheckCircle2, AlertTriangle, ScanLine, Loader2, Circle, XCircle
} from "lucide-react";
import NavBar from "../components/NavBar";
import { C } from "../colors";
import type { Screen } from "../App";

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  file: File;
}

type Props = {
  onNavigate: (s: Screen) => void;
  onSetFiles: (master: string, revised: string, bulk: boolean) => void;
};

type ModalPhase =
  | null
  | { type: 'preprocessing'; pairIndex: number; step: number }
  | { type: 'preprocessing-complete' }
  | { type: 'preprocessing-alert' }
  | { type: 'analysing'; pairIndex: number; step: number };

const PRE_STEPS = ['Rendering files', 'Calibrating resolution', 'Aligning pages'];
const ANALYSIS_STEPS = [
  'Uploading files',
  'Rendering files',
  'Calibrating resolution',
  'Aligning pages',
  'Detecting changes',
  'Classifying findings',
  'Compiling report',
];

function Spinner({ size = 16, color = '#1C2E59' }: { size?: number; color?: string }) {
  return (
    <Loader2 className="animate-spin shrink-0" style={{ width: size, height: size, color }} />
  );
}

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  }
  if (state === 'active') {
    return <Loader2 className="h-3.5 w-3.5 text-[#1C2E59] animate-spin shrink-0" />;
  }
  return <Circle className="h-3.5 w-3.5 text-slate-200 shrink-0" />;
}

export default function UploadComparisonScreen({ onNavigate, onSetFiles }: Props) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [master, setMaster] = useState<UploadedFile | null>({ name: 'Master.pdf', size: 486400, url: '#', file: new File([], 'Master.pdf') });
  const [revised, setRevised] = useState<UploadedFile | null>({ name: 'Revised.pdf', size: 478412, url: '#', file: new File([], 'Revised.pdf') });
  const [bulkMasters, setBulkMasters] = useState<UploadedFile[]>([]);
  const [bulkRevised, setBulkRevised] = useState<UploadedFile[]>([]);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [modalPhase, setModalPhase] = useState<ModalPhase>(null);

  const pairCount = Math.min(bulkMasters.length, bulkRevised.length);
  const bulkHasFiles = bulkMasters.length > 0 && bulkRevised.length > 0;
  const bulkMismatch = bulkHasFiles && bulkMasters.length !== bulkRevised.length;
  const ready = mode === "single" ? !!master && !!revised : bulkHasFiles;

  const extraMasters = bulkMasters.length > bulkRevised.length ? bulkMasters.slice(bulkRevised.length) : [];
  const extraRevised = bulkRevised.length > bulkMasters.length ? bulkRevised.slice(bulkMasters.length) : [];

  useEffect(() => {
    if (!modalPhase) return;

    const actualPairCount = mode === 'bulk' ? pairCount : 1;

    if (modalPhase.type === 'preprocessing') {
      if (modalPhase.step < PRE_STEPS.length - 1) {
        const t = setTimeout(() => setModalPhase({ type: 'preprocessing', pairIndex: modalPhase.pairIndex, step: modalPhase.step + 1 }), 900);
        return () => clearTimeout(t);
      } else {
        if (modalPhase.pairIndex < actualPairCount) {
          const t = setTimeout(() => setModalPhase({ type: 'preprocessing', pairIndex: modalPhase.pairIndex + 1, step: 0 }), 900);
          return () => clearTimeout(t);
        } else {
          const t = setTimeout(() => setModalPhase({ type: 'preprocessing-complete' }), 900);
          return () => clearTimeout(t);
        }
      }
    }

    if (modalPhase.type === 'analysing') {
      if (modalPhase.step < ANALYSIS_STEPS.length - 1) {
        const t = setTimeout(() => setModalPhase({ type: 'analysing', pairIndex: modalPhase.pairIndex, step: modalPhase.step + 1 }), 600);
        return () => clearTimeout(t);
      } else {
        if (modalPhase.pairIndex < actualPairCount) {
          const t = setTimeout(() => setModalPhase({ type: 'analysing', pairIndex: modalPhase.pairIndex + 1, step: 0 }), 700);
          return () => clearTimeout(t);
        } else {
          const t = setTimeout(() => {
            onSetFiles(master?.name || 'Master.pdf', revised?.name || 'Revised.pdf', mode === 'bulk');
            onNavigate('analysis');
          }, 750);
          return () => clearTimeout(t);
        }
      }
    }
  }, [modalPhase, onNavigate, onSetFiles, master, revised, mode, pairCount]);

  const handleRunComparison = () => {
    if (!ready) return;
    if (mode === "bulk") {
      const repMasters: any[] = [];
      const repRevised: any[] = [];
      const masterSrc = { name: 'Master.pdf', size: 486400, url: '#', file: new File([], 'Master.pdf') };
      const revisedSrc = { name: 'Revised.pdf', size: 478412, url: '#', file: new File([], 'Revised.pdf') };
      const addMasterSrc = { name: 'additional changes master.pdf', size: 486400, url: '#', file: new File([], 'master.pdf') };
      const addRevisedSrc = { name: 'additional changes revised.pdf', size: 478412, url: '#', file: new File([], 'revised.pdf') };
      for (let i = 0; i < 20; i++) {
        const isEven = i % 2 === 0;
        repMasters.push(isEven ? { ...masterSrc } : { ...addMasterSrc });
        repRevised.push(isEven ? { ...revisedSrc } : { ...addRevisedSrc });
      }
      setBulkMasters(repMasters);
      setBulkRevised(repRevised);
    }
    setModalPhase({ type: 'preprocessing', pairIndex: 1, step: 0 });
  };

  const handleContinue = () => {
    if (modalPhase?.type === 'preprocessing-complete') {
      setModalPhase({ type: 'preprocessing-alert' });
    } else if (modalPhase?.type === 'preprocessing-alert') {
      onSetFiles(master?.name || 'Master.pdf', revised?.name || 'Revised.pdf', mode === 'bulk');
      onNavigate('analysis');
    }
  };

  const handleReupload = () => {
    setModalPhase(null);
    setShowMismatchDialog(false);
  };

  const handleDemoLoad = () => {
    if (mode === "single") {
      if (master?.name === 'Master.pdf') {
        setMaster({ name: 'additional changes master.pdf', size: 486400, url: '#', file: new File([], 'master.pdf') });
        setRevised({ name: 'additional changes revised.pdf', size: 478412, url: '#', file: new File([], 'revised.pdf') });
      } else {
        setMaster({ name: 'Master.pdf', size: 486400, url: '#', file: new File([], 'Master.pdf') });
        setRevised({ name: 'Revised.pdf', size: 478412, url: '#', file: new File([], 'Revised.pdf') });
      }
    } else {
      const masterSrc = { name: 'Master.pdf', size: 486400, url: '#', file: new File([], 'Master.pdf') };
      const revisedSrc = { name: 'Revised.pdf', size: 478412, url: '#', file: new File([], 'Revised.pdf') };
      const addMasterSrc = { name: 'additional changes master.pdf', size: 486400, url: '#', file: new File([], 'master.pdf') };
      const addRevisedSrc = { name: 'additional changes revised.pdf', size: 478412, url: '#', file: new File([], 'revised.pdf') };
      const rMasters: any[] = [];
      const rRevised: any[] = [];
      for (let i = 0; i < 20; i++) {
        const isEven = i % 2 === 0;
        rMasters.push(isEven ? { ...masterSrc } : { ...addMasterSrc });
        rRevised.push(isEven ? { ...revisedSrc } : { ...addRevisedSrc });
      }
      setBulkMasters(rMasters);
      setBulkRevised(rRevised);
    }
  };

  const mismatchDialog = showMismatchDialog && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-7 w-[500px] flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-0.5">
              Label Count Mismatch
            </div>
            <div className="text-xs text-gray-500">
              {bulkMasters.length} master label{bulkMasters.length !== 1 ? "s" : ""} vs{" "}
              {bulkRevised.length} revised label{bulkRevised.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            The following {extraMasters.length + extraRevised.length} label
            {extraMasters.length + extraRevised.length !== 1 ? "s" : ""} will{" "}
            <span className="font-semibold">not be considered</span> in the comparison:
          </p>
          <ul className="text-xs text-gray-500 space-y-1 border border-gray-200 rounded px-4 py-3 bg-gray-50 max-h-32 overflow-y-auto">
            {extraMasters.map((f, i) => (
              <li key={`m${i}`} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="truncate">{f.name}</span>
                <span className="ml-auto shrink-0 text-[10px] font-medium text-red-500 uppercase">Master</span>
              </li>
            ))}
            {extraRevised.map((f, i) => (
              <li key={`r${i}`} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">{f.name}</span>
                <span className="ml-auto shrink-0 text-[10px] font-medium text-blue-500 uppercase">Revised</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
          <button
            onClick={() => setShowMismatchDialog(false)}
            className="px-5 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Re-upload
          </button>
          <button
            onClick={() => { setShowMismatchDialog(false); setModalPhase({ type: 'preprocessing', pairIndex: 1, step: 0 }); }}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#1C2E59] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            Proceed
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <>
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col" style={{ opacity: modalPhase ? 0.45 : 1 }}>
        <NavBar
          showBack
          onBack={() => onNavigate('proofreader-dashboard')}
          steps={[
            { label: 'Upload Labels', active: true },
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
                Compare labels
              </h1>
              <p className="text-sm text-gray-500">
                Upload a master and revised label to identify text, graphics, and barcode differences.
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-[#F1F3F4] border border-[#E0E0E0] rounded-full p-1">
                {(["single", "bulk"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      if (m === "bulk" && bulkMasters.length === 0) {
                        const baseM = [
                          { name: 'Master.pdf', size: 486400, url: '#', file: new File([], 'Master.pdf'), pageCount: 1 } as any,
                          { name: 'additional changes master.pdf', size: 486400, url: '#', file: new File([], 'master.pdf'), pageCount: 1 } as any,
                        ];
                        const baseR = [
                          { name: 'Revised.pdf', size: 478412, url: '#', file: new File([], 'Revised.pdf'), pageCount: 1 } as any,
                          { name: 'additional changes revised.pdf', size: 478412, url: '#', file: new File([], 'revised.pdf'), pageCount: 1 } as any,
                        ];
                        const rMasters: any[] = [];
                        const rRevised: any[] = [];
                        for (let i = 0; i < 20; i++) {
                          const isEven = i % 2 === 0;
                          rMasters.push(isEven ? { ...baseM[0] } : { ...baseM[1] });
                          rRevised.push(isEven ? { ...baseR[0] } : { ...baseR[1] });
                        }
                        setBulkMasters(rMasters);
                        setBulkRevised(rRevised);
                      }
                      if (m === "single" && !master) {
                        setMaster({ name: 'Master.pdf', size: 486400, url: '#', file: new File([], 'Master.pdf') });
                        setRevised({ name: 'Revised.pdf', size: 478412, url: '#', file: new File([], 'Revised.pdf') });
                      }
                    }}
                    className={`px-5 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${
                      mode === m
                        ? "bg-white text-[#1C2E59] border border-[#E0E0E0] shadow-sm font-medium"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {m === "single" ? "Single pair" : "Bulk upload"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "single" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DropZone label="Master Labels" file={master} onFile={setMaster} onClear={() => setMaster(null)} variant="master" singleMode />
                <DropZone label="Revised Labels" file={revised} onFile={setRevised} onClear={() => setRevised(null)} variant="revised" singleMode />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MultiDropZone label="Master Labels" files={bulkMasters} onFiles={setBulkMasters} variant="master" />
                  <MultiDropZone label="Revised Labels" files={bulkRevised} onFiles={setBulkRevised} variant="revised" />
                </div>
              </div>
            )}

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
        </main>

        <footer className="py-4 text-center text-xs shrink-0">
          Deterministic · No ML · Audit-ready
        </footer>
      </div>

      {mismatchDialog}

      {/* Processing Modal Overlay */}
      {modalPhase && (
        <ProcessingModal
          phase={modalPhase}
          onContinue={handleContinue}
          onReupload={handleReupload}
          totalPairs={mode === 'bulk' ? pairCount : 1}
          masterNames={mode === 'bulk' ? bulkMasters.map(f => f.name) : [master?.name ?? 'Master.pdf']}
          revisedNames={mode === 'bulk' ? bulkRevised.map(f => f.name) : [revised?.name ?? 'Revised.pdf']}
        />
      )}
    </>
  );
}

// ── DropZone Component ──────────────────────────────────────────────────────
function DropZone({
  label, file, onFile, onClear, variant = "master", singleMode = false,
}: {
  label: string;
  file: UploadedFile | null;
  onFile: (f: UploadedFile) => void;
  onClear: () => void;
  variant?: "master" | "revised";
  singleMode?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    onFile({ name: f.name, size: f.size, url: URL.createObjectURL(f), file: f });
  };

  const accentColor = variant === "master" ? "#ea580c" : "#2563EB";

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
        <div className="text-sm font-semibold text-gray-700">Add more files</div>
        <div className="text-xs text-gray-400 mt-0.5">PDF or PNG</div>
        <input ref={inputRef} type="file" accept=".pdf,.png,application/pdf,image/png" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {file && (
        <div className="space-y-2 mt-3">
          {/* Primary file card */}
          <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-white">
            <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
              <FileText className="h-4 w-4" style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-800 truncate">
                {file.name}
              </div>
              <div className="text-[10px] text-gray-400">
                {file.name === 'Master.pdf' ? '475.0 KB · 1 page'
                  : file.name === 'Revised.pdf' ? '468.2 KB · 1 page'
                  : file.name === 'additional changes master.pdf' ? '486.4 KB · 1 page'
                  : file.name === 'additional changes revised.pdf' ? '478.4 KB · 1 page'
                  : `${formatBytes(file.size)}`}
              </div>
            </div>
            <button onClick={onClear} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer" aria-label="Remove">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Card 2 — only shown in bulk/non-single mode */}
          {!singleMode && (file.name === 'Master.pdf' || file.name === 'additional changes master.pdf' || file.name === 'Revised.pdf' || file.name === 'additional changes revised.pdf') && (
            <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-white">
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                <FileText className="h-4 w-4" style={{ color: accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">
                  {variant === 'master' ? 'additional changes master.pdf' : 'additional changes revised.pdf'}
                </div>
                <div className="text-[10px] text-gray-400">
                  {variant === 'master' ? '486.4 KB · 1 page' : '478.4 KB · 1 page'}
                </div>
              </div>
              <button onClick={onClear} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer" aria-label="Remove">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MultiDropZone Component ──────────────────────────────────────────────────
function MultiDropZone({
  label, files, onFiles, variant = "master",
}: {
  label: string;
  files: UploadedFile[];
  onFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  variant?: "master" | "revised";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const arr = Array.from(fileList).map(f => ({
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
      file: f
    }));
    onFiles(prev => [...prev, ...arr]);
  };

  const accentColor = variant === "master" ? "#ea580c" : "#2563EB";
  const atLimit = files.length >= 50;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
        <div className="text-xs font-medium uppercase tracking-wide" style={{ color: accentColor }}>{label}</div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); if (!atLimit) setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => { e.preventDefault(); setHover(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => { if (!atLimit) inputRef.current?.click(); }}
        className={`bg-white border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center transition-colors h-36 ${atLimit ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ borderColor: hover ? accentColor : undefined, borderLeft: `3px solid ${accentColor}` }}
      >
        <Upload className="h-6 w-6 mb-2 text-gray-400" />
        <div className="text-sm font-semibold text-gray-700">{atLimit ? `Limit reached (50)` : 'Add more files'}</div>
        <div className="text-xs text-gray-400 mt-0.5">{atLimit ? '' : 'PDF or PNG'}</div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.png,application/pdf,image/png" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
          {files.map((f, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-white">
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                <FileText className="h-4 w-4" style={{ color: accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">{f.name}</div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                  <span>
                    {f.name === 'Master.pdf' ? '475.0 KB'
                      : f.name === 'Revised.pdf' ? '468.2 KB'
                      : f.name === 'additional changes master.pdf' ? '486.4 KB'
                      : f.name === 'additional changes revised.pdf' ? '467.2 KB'
                      : formatBytes(f.size)}
                  </span>
                  {(f as any).pageCount !== undefined && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="font-medium" style={{ color: accentColor }}>
                        {(f as any).pageCount} {(f as any).pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onFiles(prev => prev.filter((_, i) => i !== idx)); }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
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
  totalPairs,
  masterNames,
  revisedNames,
}: {
  phase: ModalPhase;
  onContinue: () => void;
  onReupload: () => void;
  totalPairs: number;
  masterNames: string[];
  revisedNames: string[];
}) {
  if (!phase) return null;

  const isPreprocessing = phase.type === 'preprocessing';
  const isAnalysing = phase.type === 'analysing';
  const isComplete = phase.type === 'preprocessing-complete';
  const isAlert = phase.type === 'preprocessing-alert';

  const currentStep = (isPreprocessing || isAnalysing) ? (phase as { type: string; step: number }).step : -1;
  const steps = isAnalysing ? ANALYSIS_STEPS : PRE_STEPS;

  const pairText = totalPairs === 1 ? '1 pair' : `${totalPairs} pairs`;
  const title = isAnalysing ? `Analysing ${pairText}` : `Verifying ${pairText} of labels for Analysis`;

  const activePairIndex = (isPreprocessing || isAnalysing)
    ? (phase as { type: string; pairIndex: number }).pairIndex
    : (isComplete || isAlert ? totalPairs : 1);

  const activeMaster = masterNames[activePairIndex - 1] ?? masterNames[0];
  const activeRevised = revisedNames[activePairIndex - 1] ?? revisedNames[0];

  const passedFiles: string[] = isComplete || isAlert
    ? masterNames.slice()
    : masterNames.slice(0, activePairIndex - 1);

  const progressCompleted = (isComplete || isAlert) ? totalPairs : (activePairIndex - 1);
  const progressPercent = Math.round((progressCompleted / totalPairs) * 100);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[120] bg-black/30 backdrop-blur-[2px]">
      {isAlert && (
        <div className="bg-white rounded-xl shadow-xl p-7 w-[520px] flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wide mb-0.5">
                PRE-PROCESSING COMPLETE
              </div>
              <div className="text-xs text-[#5F6368]">
                {totalPairs > 1 ? 'All pages' : 'Page'} passed validation
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-700 font-medium px-1">
            {totalPairs} {totalPairs === 1 ? 'page' : 'pages'} ready to compare.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onReupload}
              className="px-5 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-slate-700"
            >
              Re-upload
            </button>
            <button
              onClick={onContinue}
              className="px-6 py-2.5 text-sm font-bold uppercase tracking-wider bg-[#1C2E59] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              PROCEED <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {!isAlert && (
        <div className="bg-white rounded-xl shadow-xl p-7 w-[580px] flex flex-col gap-5">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ScanLine className="h-4 w-4 text-[#1C2E59] animate-spin" style={{ animationDuration: "2.2s" }} />
              <span className="text-xs font-bold tracking-tight uppercase text-[#1C2E59]">ProofX</span>
            </div>
            <div className="text-lg font-semibold text-[#1A1A2E] mb-2">
              {title}
            </div>
            <p className="text-[11px] text-[#253e7a] leading-relaxed bg-[#f0f4f8] border border-blue-100 p-2.5 rounded-lg">
              <strong>Why preprocessing?</strong> We align pages and calibrate image resolution so that differences are detected with pixel-level accuracy.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Pipeline Status Box */}
            {!isComplete && (
              <div className="border border-slate-200 rounded-lg overflow-hidden border-[#1C2E59]/20 bg-white">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#F4F6F8]">
                  <Spinner size={16} color="#1C2E59" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#1C2E59] truncate flex items-center gap-1">
                      <span className="text-[#8F9CAE]">#{activePairIndex}</span>
                      <span>{activeMaster}</span>
                      <span className="text-[#8F9CAE] font-normal px-0.5">vs</span>
                      <span>{activeRevised}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1C2E59] shrink-0">
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
                          : state === 'active' ? 'text-[#1C2E59] font-medium'
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

            {/* Pass / Skipped Panels */}
            <div className="flex gap-3">
              {/* Pass */}
              <div className="flex-1 border border-[#E0E0E0] rounded-lg overflow-hidden bg-white">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border-b border-[#E0E0E0]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span className="text-xs font-semibold text-green-800">Pass ({passedFiles.length})</span>
                </div>
                <div className="h-40 overflow-y-auto p-3 bg-white space-y-1.5">
                  {passedFiles.length > 0 ? (
                    passedFiles.map(fn => (
                      <div key={fn} className="text-[11px] text-[#1A1A2E] truncate font-medium" title={fn}>
                        {fn}
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-[#5F6368] italic">None yet</div>
                  )}
                </div>
              </div>

              {/* Skipped */}
              <div className="flex-1 border border-red-200 rounded-lg overflow-hidden bg-white">
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-b border-red-200">
                  <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span className="text-xs font-semibold text-red-800">Skipped (0)</span>
                </div>
                <div className="h-40 overflow-y-auto p-3 bg-white">
                  <div className="text-[11px] text-[#5F6368] italic">None</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 mt-1">
              <div className="flex justify-between text-xs text-[#5F6368]">
                <span>Pre-processing</span>
                <span className="font-medium text-[#1A1A2E]">{progressCompleted} / {totalPairs}</span>
              </div>
              <div className="h-1.5 bg-[#F1F3F4] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1C2E59] transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
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
                  onClick={onContinue}
                  className="flex-1 py-2.5 rounded-lg bg-[#1C2E59] text-white text-sm font-semibold hover:bg-[#1C2E59]/90 active:bg-[#1C2E59]/80 transition-colors cursor-pointer"
                >
                  Continue
                </button>
              </div>
            )}

            <div className="text-xs text-[#5F6368]">Deterministic · No ML · Audit-ready</div>
          </div>
        </div>
      )}
    </div>
  );
}
