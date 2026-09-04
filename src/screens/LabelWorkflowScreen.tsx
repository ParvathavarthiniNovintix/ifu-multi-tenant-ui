import NavBar from '../components/NavBar'
import RecentRunsTable, { type RunRow } from '../components/RecentRunsTable'
import { FileText, ClipboardList, CheckCircle2, ArrowRight } from 'lucide-react'
import { C } from '../colors'
import type { Screen } from '../App'

type Props = {
  onNavigate: (s: Screen) => void
  onSetFiles?: (master: string, revised: string, bulk: boolean) => void
  onSetLrfFlowActive?: (active: boolean) => void
}

const labelRuns: RunRow[] = [
  { datetime: 'Jul 21, 2026, 11:52 AM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 0, findings: 12, workflow: 'PROOF READING', status: 'PASS' },
  { datetime: 'Jul 21, 2026, 10:52 AM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 0, findings: 1, workflow: 'PROOF READING', status: 'PASS' },
  { datetime: 'Jul 23, 2026, 2:02 PM', master: 'Master.pdf', revised: 'Revised.pdf', mode: 'SINGLE', pairs: 1, skipped: 0, findings: 0, workflow: 'PROOF READING', status: 'PASS' },
  { datetime: 'Jul 4, 2026, 02:57 PM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 0, findings: 12, workflow: 'VISUAL COMPARISON', status: 'PASS' },
  { datetime: 'Jul 17, 2026, 08:17 PM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 0, findings: 4, workflow: 'VISUAL COMPARISON', status: 'PASS' },
]

export default function LabelWorkflowScreen({ onNavigate, onSetFiles, onSetLrfFlowActive }: Props) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg }}>
      <NavBar
        showBack
        onBack={() => onNavigate('proofreader-dashboard')}
        subtitle="Label proofing reading tool"
        showProfile
        onProfileClick={() => onNavigate('profile')}
        onLogout={() => onNavigate('login')}
        profileName="Athmika"
        profileInitials="A"
      />

      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-6 py-10 flex flex-col items-center w-full mx-auto" style={{ maxWidth: 1100 }}>
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: C.muted }}>
              {/* ● Deterministic · No ML · Audit-ready */}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
            Select your workflow
          </h1>
          <p className="text-sm" style={{ color: C.muted, maxWidth: 480, margin: '0 auto' }}>
            Compare labels and flag differences — run a quick comparison or validate against a Change Request Form.
          </p>
        </div>

        {/* Workflow cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-10">
          {/* Card 1 — Visual Comparison */}
          <div className="p-6 flex flex-col border border-gray-200 border-t-4 border-t-[#ea580c] bg-white">
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 44, height: 44, backgroundColor: '#fff3eb' }}
              >
                <FileText size={22} className="text-[#ea580c]" />
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border border-[#ea580c]/20"
                style={{ backgroundColor: '#fff3eb', color: '#ea580c' }}
              >
                QUICK · NO SETUP
              </span>
            </div>
            <h2 className="font-bold text-base mb-2 text-gray-900">Label visual comparison</h2>
            <p className="text-sm mb-4 text-gray-500 leading-relaxed">
              Upload a master and revised label pair. Differences are detected and annotated automatically across all categories.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {['Single or bulk label pairs', 'PDF & PNG support', 'Text, graphics & barcode diff', 'Exportable comparison report'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={16} className="text-[#ea580c] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('upload-comparison')}
              className="mt-auto w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer hover:opacity-95"
              style={{ backgroundColor: '#f2801d' }}
            >
              Start Comparison <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 2 — Proof Reading */}
          <div className="p-6 flex flex-col border border-gray-200 border-t-4 border-t-[#1C2E59] bg-white">
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 44, height: 44, backgroundColor: '#f0f2f9' }}
              >
                <ClipboardList size={22} className="text-[#1C2E59]" />
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border border-[#1C2E59]/20"
                style={{ backgroundColor: '#f0f2f9', color: '#1C2E59' }}
              >
                VALIDATED · AUDIT-READY
              </span>
            </div>
            <h2 className="font-bold text-base mb-2 text-gray-900">Label proof reading</h2>
            <p className="text-sm mb-4 text-gray-500 leading-relaxed">
              Begin with a Change Request Form to declare expected changes. Every finding is automatically classified as Expected or Unexpected.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {['Declare expected changes upfront', 'Auto-classify findings as Expected / Unexpected', 'Change priorities with severity levels', 'Audit-ready CRF validation trail'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={16} className="text-[#1C2E59] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('change-request-form')}
              className="mt-auto w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer hover:opacity-95"
              style={{ backgroundColor: '#1C2E59' }}
            >
              Start with your changes <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <RecentRunsTable
          title="Recent Label Runs"
          runs={labelRuns}
          workflowOptions={['VISUAL COMPARISON', 'PROOF READING']}
          historyScreen="proofreader-history"
          csvFileName="proofx-label-runs.csv"
          onNavigate={onNavigate}
          onSetFiles={onSetFiles}
          onSetLrfFlowActive={onSetLrfFlowActive}
        />
        </div>
      </div>

      <footer className="text-center py-4 shrink-0">
        <p className="text-xs" style={{ color: C.muted }}>ProofX · Label Compliance</p>
      </footer>
    </div>
  )
}
