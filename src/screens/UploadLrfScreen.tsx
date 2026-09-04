import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Upload, FileText, X,
  CheckCircle2, Hash, Layers, User, Calendar, AlertTriangle, ScanLine, Loader2, Circle, XCircle
} from "lucide-react";
async function getPdfPageCount(file: File): Promise<number | undefined> {
  return undefined;
}

import NavBar from "../components/NavBar";
import type { Screen } from "../App";

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  file: File;
  pageCount?: number;
}

export interface UploadedFileNames {
  masterNames: string[];
  revisedNames: string[];
  masterUrls: string[];
  revisedUrls: string[];
  masterFiles: File[];
  revisedFiles: File[];
  masterPageCounts: (number | undefined)[];
  revisedPageCounts: (number | undefined)[];
}

interface Props {
  lrfData: {
    crNumber?: string;
    sku?: string;
    productName?: string;
    requestedBy?: string;
    date?: string;
    revFrom?: string;
    revTo?: string;
    list: any[];
  };
  onNavigate: (s: Screen) => void;
  onSetLrfFlowActive: (active: boolean) => void;
  onSetFiles: (master: string, revised: string, bulk?: boolean) => void;
}

// Note: red/green are reserved for PASS/FAIL status only — categories and change types use other theme colors.
const CAT_COLORS: Record<string, string> = {
  text: "bg-blue-50 text-blue-700 border-blue-200",
  graphics: "bg-amber-50 text-amber-700 border-amber-200",
  barcode: "bg-violet-50 text-violet-700 border-violet-200",
};
const CHANGE_COLORS: Record<string, string> = {
  Add: "bg-teal-50 text-teal-700 border-teal-200",
  Remove: "bg-slate-100 text-slate-700 border-slate-300",
  Delete: "bg-slate-100 text-slate-700 border-slate-300",
  Modify: "bg-blue-50 text-blue-700 border-blue-200",
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

function Spinner({ size = 16, color = '#ea580c' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
      <circle cx="12" cy="12" r="9" stroke={`${color}30`} strokeWidth="2.5" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return (
      <div className="flex items-center justify-center rounded-full bg-emerald-50" style={{ width: 20, height: 20 }}>
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      </div>
    );
  }
  if (state === 'active') {
    return <Spinner size={20} color="#ea580c" />;
  }
  return (
    <div className="flex items-center justify-center rounded-full border border-gray-200 bg-white" style={{ width: 20, height: 20 }}>
      <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
    </div>
  );
}

export default function UploadLrfScreen({ lrfData, onNavigate, onSetLrfFlowActive, onSetFiles }: Props) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [master, setMaster] = useState<UploadedFile | null>({ name: 'Master.pdf', size: 486400, url: '#', file: new File([], 'Master.pdf') });
  const [revised, setRevised] = useState<UploadedFile | null>({ name: 'Revised.pdf', size: 478412, url: '#', file: new File([], 'Revised.pdf') });
  const [bulkMasters, setBulkMasters] = useState<UploadedFile[]>([]);
  const [bulkRevised, setBulkRevised] = useState<UploadedFile[]>([]);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [modalPhase, setModalPhase] = useState<ModalPhase>(null);

  const closeMismatchDialog = () => {
    setShowMismatchDialog(false);
  };

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
            onSetLrfFlowActive(true);
            onNavigate('analysis');
          }, 750);
          return () => clearTimeout(t);
        }
      }
    }
  }, [modalPhase, onNavigate, onSetLrfFlowActive, onSetFiles, master, revised, mode, pairCount]);

  const dispatchRun = () => {
    setModalPhase({ type: 'preprocessing', pairIndex: 1, step: 0 });
  };

  const handleRun = () => {
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
    dispatchRun();
  };

  const handleContinue = () => {
    if (modalPhase?.type === 'preprocessing-complete') {
      setModalPhase({ type: 'preprocessing-alert' });
    } else if (modalPhase?.type?.toString() === 'preprocessing-alert') {
      onSetFiles(master?.name || 'Master.pdf', revised?.name || 'Revised.pdf', mode === 'bulk');
      onSetLrfFlowActive(true);
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
            onClick={closeMismatchDialog}
            className="px-5 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Re-upload
          </button>
          <button
            onClick={() => { closeMismatchDialog(); dispatchRun(); }}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wider bg-[#1C2E59] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
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
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <NavBar
          showBack
          onBack={() => onNavigate('change-request-form')}
          title="Review & Upload"
          steps={[
            { label: 'Change Request Form', done: true },
            { label: 'Upload Labels', active: true },
            { label: 'Analysis' },
          ]}
          showProfile
          onProfileClick={() => onNavigate('profile')}
          profileName="Athmika"
          profileInitials="A"
        />

        <div className="flex-1 w-full mx-auto max-w-5xl px-6 py-8 space-y-6 pb-28">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                Review &amp; Upload Labels
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Verify the CRF details below, then upload the master and revised labels to run the comparison.
              </p>
            </div>
            <button
              onClick={() => onNavigate('change-request-form')}
              className="flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors shadow-sm rounded"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Edit CRF
            </button>
          </div>

          <div className="grid grid-cols-5 gap-6">
            {/* Left: CRF summary */}
            <div className="col-span-3 space-y-4">
              {/* Metadata card */}
              <div className="bg-white border border-gray-200 shadow-sm rounded">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Document Metadata
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="px-5 divide-y divide-gray-50">
                  {lrfData.crNumber && (
                    <MetaRow icon={Hash} label="CR Number" value={lrfData.crNumber} />
                  )}
                  {/* Label revision */}
                  {(lrfData.revFrom || lrfData.revTo) && (
                    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                      <div className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                          Label Revision
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 min-w-[72px] justify-center rounded">
                            {lrfData.revFrom || "—"}
                          </span>
                          <ArrowRight className="h-4 w-4 text-[#1e2a52] shrink-0" />
                          <span className="inline-flex items-center px-3 py-1 border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 min-w-[72px] justify-center rounded">
                            {lrfData.revTo || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {lrfData.requestedBy && (
                    <MetaRow icon={User} label="Requested By" value={lrfData.requestedBy} />
                  )}
                  {lrfData.date && (
                    <MetaRow icon={Calendar} label="Date" value={lrfData.date} />
                  )}
                </div>
              </div>

              {/* Required changes table */}
              <div className="bg-white border border-gray-200 shadow-sm rounded">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Required Changes
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#1e2a52]/10 border border-[#1e2a52]/20 text-xs font-bold text-[#1e2a52]">
                    {lrfData.list.length} item{lrfData.list.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {lrfData.list.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-400 italic">
                    No attribute changes defined.
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {["Attribute", "Category", "Change Type", "Old Value", "New Value"].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50/50"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lrfData.list.map((c, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-4 py-2.5 font-semibold text-gray-800">
                              {c.name}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded ${CAT_COLORS[c.category.toLowerCase()] ?? "bg-gray-50 text-gray-600 border-gray-200"
                                  }`}
                              >
                                {c.category}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded ${CHANGE_COLORS[c.changeType] ?? "bg-gray-50 text-gray-600 border-gray-200"
                                  }`}
                              >
                                {c.changeType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 font-mono max-w-[120px] truncate" title={c.fromValue}>
                              {c.fromValue || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 font-mono max-w-[120px] truncate" title={c.toValue}>
                              {c.toValue || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Right: Upload */}
            <div className="col-span-2 space-y-4">
              <div className="bg-white border border-gray-200 shadow-sm rounded">
                <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-gray-500">
                    Upload Labels
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${mode === 'bulk' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-[#1C2E59] border-blue-200'
                    }`}>
                    {mode === 'bulk' ? 'Bulk' : 'Single'}
                  </span>
                </div>
                <div className="px-5 py-5 space-y-5">
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    Upload both the master (current version) and revised (new version) labels.
                  </p>

                  <div className="inline-flex bg-[#F1F3F4] border border-[#E0E0E0] rounded-full p-0.5">
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
                        className={`px-4 py-1 text-xs rounded-full transition-colors cursor-pointer ${mode === m
                            ? "bg-white text-[#1C2E59] border border-[#E0E0E0] shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        {m === "single" ? "Single pair" : "Bulk upload"}
                      </button>
                    ))}
                  </div>

                  {mode === "single" ? (
                    <div className="space-y-4">
                      <DropZone label="Master label (current version)" file={master} onFile={setMaster} onClear={() => setMaster(null)} variant="master" compact singleMode />
                      <DropZone label="Revised label (new version)" file={revised} onFile={setRevised} onClear={() => setRevised(null)} variant="revised" compact singleMode />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <MultiDropZone label="Master Labels" files={bulkMasters} onFiles={setBulkMasters} variant="master" compact />
                      <MultiDropZone label="Revised Labels" files={bulkRevised} onFiles={setBulkRevised} variant="revised" compact />
                    </div>
                  )}

                  {ready && (
                    <div className="flex items-center gap-2 text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-3 py-2 rounded">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {mode === 'bulk' ? `${pairCount} pair${pairCount !== 1 ? 's' : ''} ready` : 'Both labels ready — CRF validation will run'}
                    </div>
                  )}
                </div>
              </div>

              {/* What happens next */}
              <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded">
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">
                  What happens next?
                </div>
                <ul className="text-xs text-blue-700 space-y-1 leading-relaxed">
                  <li>• Labels are compared for text, graphics, and barcode differences.</li>
                  <li>• Each finding is classified as Expected or Unexpected against the {lrfData.list.length} required change{lrfData.list.length !== 1 ? "s" : ""}.</li>
                  <li>• You can then export a full audit-ready PDF report.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-8 py-3 flex items-center justify-between z-10 shrink-0">
          <div className="font-mono text-xs text-gray-500">
            {lrfData.crNumber && <span>Ref: {lrfData.crNumber}</span>}
          </div>
          <div className="flex items-center gap-4">
            {!ready && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Upload both labels to enable submission
              </span>
            )}
            <button
              onClick={handleRun}
              disabled={!ready}
              className="flex items-center gap-2 px-7 py-2.5 text-[13px] font-bold uppercase tracking-widest transition-all rounded-lg shadow-sm bg-[#1C2E59] text-white hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Run Comparison
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {mismatchDialog}

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

// ── Shared helpers ─────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm font-semibold text-gray-800 break-words">
          {value || <span className="text-gray-400 font-normal italic">Not specified</span>}
        </div>
      </div>
    </div>
  );
}

function DropZone({
  label, file, onFile, onClear, variant = "master", compact = false, singleMode = false,
}: {
  label: string;
  file: UploadedFile | null;
  onFile: (f: UploadedFile) => void;
  onClear: () => void;
  variant?: "master" | "revised";
  compact?: boolean;
  singleMode?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setPageError(null);
    if (f.name.toLowerCase().endsWith(".pdf")) {
      const pageCount = await getPdfPageCount(f);
      if (pageCount !== undefined && pageCount > 1) {
        setPageError(`This PDF has ${pageCount} pages — use Bulk upload for multi-label files.`);
        return;
      }
    }
    onFile({ name: f.name, size: f.size, url: URL.createObjectURL(f), file: f });
  };

  const handleClear = () => {
    setPageError(null);
    onClear();
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
        className={`bg-white border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${compact ? "h-24" : "h-36"}`}
        style={{ borderColor: hover ? accentColor : undefined, borderLeft: `3px solid ${accentColor}` }}
      >
        <Upload className="h-5 w-5 mb-2 text-gray-400" />
        <div className="text-sm text-gray-700">Add file</div>
        <div className="text-xs text-gray-400 mt-0.5">PDF or PNG</div>
        <input ref={inputRef} type="file" accept=".pdf,.png,application/pdf,image/png" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {file && (
        <div className="space-y-2 mt-2">
          {/* Primary file card */}
          <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-md bg-white">
            <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
              <FileText className="h-4 w-4" style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800 truncate">{file.name}</div>
              <div className="text-xs text-gray-400">
                {file.name === 'Master.pdf' ? '475.0 KB'
                  : file.name === 'Revised.pdf' ? '468.2 KB'
                    : file.name === 'additional changes master.pdf' ? '486.4 KB'
                      : file.name === 'additional changes revised.pdf' ? '478.4 KB'
                        : formatBytes(file.size)}
              </div>
            </div>
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer" aria-label="Remove">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Card 2 — only shown in bulk/non-single mode */}
          {!singleMode && (file.name === 'Master.pdf' || file.name === 'additional changes master.pdf' || file.name === 'Revised.pdf' || file.name === 'additional changes revised.pdf') && (
            <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-md bg-white">
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                <FileText className="h-4 w-4" style={{ color: accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 truncate">
                  {variant === 'master' ? 'additional changes master.pdf' : 'additional changes revised.pdf'}
                </div>
                <div className="text-xs text-gray-400">
                  {variant === 'master' ? '486.4 KB' : '478.4 KB'}
                </div>
              </div>
              <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer" aria-label="Remove">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
      {pageError && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 border border-red-200 px-3 py-2 rounded">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {pageError}
        </div>
      )}
    </div>
  );
}

const BULK_MAX_FILES = 50;

function MultiDropZone({
  label, files, onFiles, variant, compact = false,
}: {
  label: string;
  files: UploadedFile[];
  onFiles: (f: UploadedFile[]) => void;
  variant: "master" | "revised";
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const accentColor = variant === "master" ? "#ea580c" : "#2563EB";
  const atLimit = files.length >= BULK_MAX_FILES;

  const handleFiles = async (list: FileList | null) => {
    if (!list) return;
    const slots = BULK_MAX_FILES - files.length;
    if (slots <= 0) return;
    const raw = Array.from(list).slice(0, slots);
    const pageCounts = await Promise.all(raw.map(getPdfPageCount));
    const arr = raw.map((f, i) => ({
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
      file: f,
      pageCount: pageCounts[i],
    }));
    onFiles([...files, ...arr]);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: accentColor }}>{label}</div>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">{files.length} / {BULK_MAX_FILES}</span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); if (!atLimit) setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => { e.preventDefault(); setHover(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => { if (!atLimit) inputRef.current?.click(); }}
        className={`bg-white border border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center transition-colors ${compact ? "h-24" : "h-36"} ${atLimit ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        style={{ borderColor: hover ? accentColor : undefined, borderLeft: `3px solid ${accentColor}` }}
      >
        <Upload className="h-5 w-5 mb-2 text-gray-400" />
        <div className="text-sm text-gray-800">{atLimit ? `Limit reached (${BULK_MAX_FILES})` : "Add more files"}</div>
        <div className="text-xs text-gray-400 mt-0.5">{atLimit ? "" : "PDF or PNG"}</div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.png,application/pdf,image/png" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-md bg-white">
              <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                <FileText className="h-3.5 w-3.5" style={{ color: accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-800 truncate">{f.name}</div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                  <span>
                    {f.name === 'Master.pdf' ? '475.0 KB'
                      : f.name === 'Revised.pdf' ? '468.2 KB'
                        : f.name === 'additional changes master.pdf' ? '486.4 KB'
                          : f.name === 'additional changes revised.pdf' ? '467.2 KB'
                            : formatBytes(f.size)}
                  </span>
                  {f.pageCount !== undefined && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="font-medium" style={{ color: accentColor }}>
                        {f.pageCount} {f.pageCount === 1 ? "page" : "pages"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => onFiles(files.filter((_, j) => j !== i))} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer" aria-label="Remove">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LocalSpinner({ size = 16, color = '#1C2E59' }: { size?: number; color?: string }) {
  return (
    <Loader2 className="animate-spin shrink-0" style={{ width: size, height: size, color }} />
  );
}

function LocalStepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  }
  if (state === 'active') {
    return <Loader2 className="h-3.5 w-3.5 text-[#1C2E59] animate-spin shrink-0" />;
  }
  return <Circle className="h-3.5 w-3.5 text-slate-200 shrink-0" />;
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
                  <LocalSpinner size={16} color="#1C2E59" />
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
                        <LocalStepIcon state={state} />
                        <span className={`text-[11px] leading-none ${state === 'done' ? 'text-[#1A1A2E]'
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

