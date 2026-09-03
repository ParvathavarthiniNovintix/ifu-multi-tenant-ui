import NavBar from '../components/NavBar'
import ProofreaderSidebar from '../components/ProofreaderSidebar'
import { FileText, ClipboardList, CheckCircle2, ArrowRight } from 'lucide-react'
import { C } from '../colors'
import type { Screen } from '../App'

type Props = { onNavigate: (s: Screen) => void; onSetLrfFlowActive: (active: boolean) => void; onSetIfuFlowActive?: (active: boolean) => void; onSetFiles?: (master: string, revised: string, bulk: boolean) => void }

const recentRuns = [
  {
    datetime: 'Jul 21, 2026, 11:52 AM',
    master: '→ 2 files',
    revised: '→ 2 files',
    mode: 'BULK',
    pairs: 2,
    skipped: 0,
    findings: 12,
    workflow: 'PROOF READING',
    status: 'PASS',
  },
  {
    datetime: 'Jul 21, 2026, 10:52 AM',
    master: '→ 2 files',
    revised: '→ 2 files',
    mode: 'BULK',
    pairs: 2,
    skipped: 0,
    findings: 1,
    workflow: 'PROOF READING',
    status: 'PASS',
  },
  {
    datetime: 'Jul 23, 2026, 2:02 PM',
    master: 'Master.pdf',
    revised: 'Revised.pdf',
    mode: 'SINGLE',
    pairs: 1,
    skipped: 0,
    findings: 0,
    workflow: 'PROOF READING',
    status: 'PASS',
  },
  {
    datetime: 'Jul 4, 2026, 02:57 PM',
    master: '→ 2 files',
    revised: '→ 2 files',
    mode: 'BULK',
    pairs: 2,
    skipped: 0,
    findings: 12,
    workflow: 'VISUAL COMPARISON',
    status: 'PASS',
  },
  {
    datetime: 'Jul 17, 2026, 08:17 PM',
    master: '→ 2 files',
    revised: '→ 2 files',
    mode: 'BULK',
    pairs: 2,
    skipped: 0,
    findings: 4,
    workflow: 'VISUAL COMPARISON',
    status: 'PASS',
  },
  {
    datetime: 'Aug 1, 2026, 09:38 AM',
    master: 'IFU-current.pdf',
    revised: 'IFU-revised.pdf',
    mode: 'SINGLE',
    pairs: 1,
    skipped: 0,
    findings: 11,
    workflow: 'IFU DOCUMENT COMPARISON',
    status: 'PASS',
  },
  {
    datetime: 'Aug 3, 2026, 03:24 PM',
    master: '→ 2 files',
    revised: '→ 2 files',
    mode: 'BULK',
    pairs: 2,
    skipped: 1,
    findings: 9,
    workflow: 'IFU DOCUMENT COMPARISON',
    status: 'PASS',
  },
]

function ModeBadge({ mode }: { mode: string }) {
  const isBulk = mode === 'BULK'
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold"
      style={{
        backgroundColor: isBulk ? C.navyLight : C.grayBg,
        color: isBulk ? C.navy : C.grayText,
      }}
    >
      {mode}
    </span>
  )
}

function WorkflowBadge({ workflow }: { workflow: string }) {
  const isVc = workflow === 'VISUAL COMPARISON'
  const isIfu = workflow === 'IFU DOCUMENT COMPARISON'
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold"
      style={{
        backgroundColor: isVc ? C.orangeLight : isIfu ? '#f0ebff' : C.navyLight,
        color: isVc ? C.orangeText : isIfu ? '#5b3ecf' : C.navy,
      }}
    >
      {workflow}
    </span>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: C.muted }}>—</span>
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: C.greenLight, color: C.green }}
    >
      {status}
    </span>
  )
}

import { useState } from 'react'

export default function ProofreaderDashboardScreen({ onNavigate, onSetLrfFlowActive, onSetIfuFlowActive, onSetFiles }: Props) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})
  const [workflowFilter, setWorkflowFilter] = useState<'ALL' | 'VISUAL COMPARISON' | 'PROOF READING' | 'IFU DOCUMENT COMPARISON'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRuns = recentRuns.filter(r => {
    const matchesWorkflow = workflowFilter === 'ALL' || r.workflow === workflowFilter
    const matchesSearch =
      r.master.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.revised.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesWorkflow && matchesSearch
  })
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg }}>
      <NavBar subtitle="Label proofing reading tool" showProfile onProfileClick={() => onNavigate('profile')} onLogout={() => onNavigate('login')} profileName="Athmika" profileInitials="A" />

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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full mb-10">
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

          {/* Card 3 — IFU Document Comparison */}
          <div className="p-6 flex flex-col border border-gray-200 border-t-4 border-t-[#5b3ecf] bg-white">
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 44, height: 44, backgroundColor: '#f1edff' }}
              >
                <FileText size={22} className="text-[#5b3ecf]" />
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border border-[#5b3ecf]/20"
                style={{ backgroundColor: '#f1edff', color: '#5b3ecf' }}
              >
                IFU · DOCUMENT CHECK
              </span>
            </div>
            <h2 className="font-bold text-base mb-2 text-gray-900">Document comparison</h2>
            <p className="text-sm mb-4 text-gray-500 leading-relaxed">
              Upload a current and revised document pair. The tool identifies differences across the documents, helps you review the findings, and lets you export a complete inspection report.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {[
                'Word & PDF document support',
                'Cover-page identity validation',
                'Language-set & directory checks',
                'Text, Figure, Table & Matrix Code differences',
                'Representation changes (Image/Table ↔ Live Text)',
                'Exportable Inspection Report',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={16} className="text-[#5b3ecf] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('upload-ifu')}
              className="mt-auto w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer hover:opacity-95"
              style={{ backgroundColor: '#5b3ecf' }}
            >
              Start Document Comparison <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Recent Runs */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: C.text }}>Recent Runs</h2>
            <div className="flex items-center gap-4">
              <button
                className="text-xs cursor-pointer hover:opacity-75 transition-opacity"
                style={{ color: C.muted }}
                onClick={() => {
                  const headers = ['Date / Time', 'Master', 'Revised', 'Mode', 'Pairs', 'Skipped', 'Findings', 'Workflow', 'Status']
                  const csvRows = filteredRuns.map(r =>
                    [r.datetime, r.master, r.revised, r.mode, r.pairs, r.skipped, r.findings, r.workflow, r.status]
                      .map(v => `"${v}"`).join(',')
                  )
                  const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = 'proofx-runs.csv'
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(a.href)
                }}
              >Export CSV</button>
              <button
                className="text-xs font-medium cursor-pointer hover:opacity-75 transition-opacity"
                style={{ color: C.orange }}
                onClick={() => onNavigate('proofreader-history')}
              >View all →</button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              {(['ALL', 'VISUAL COMPARISON', 'PROOF READING', 'IFU DOCUMENT COMPARISON'] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setWorkflowFilter(w)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor: workflowFilter === w ? C.navy : C.grayBg,
                    color: workflowFilter === w ? C.white : C.grayText,
                  }}
                >
                  {w === 'IFU DOCUMENT COMPARISON' ? 'IFU Document Comparison' : w}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <circle cx="11" cy="11" r="8" stroke={C.muted} strokeWidth="1.8" />
                <path d="M21 21l-4.35-4.35" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search files…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50 focus:bg-white transition-all"
                style={{ width: 200, color: C.text }}
              />
            </div>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${C.border}`, backgroundColor: C.white }}
          >
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: C.grayBg, borderBottom: `1px solid ${C.border}` }}>
                  {['DATE / TIME', 'MASTER FILE', 'REVISED FILE', 'MODE', 'PAIRS', 'FINDINGS', 'WORKFLOW', 'RUN STATUS', 'ACTIONS'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-400 tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run, i) => (
                  <div key={i} style={{ display: 'contents' }}>
                    <tr
                      style={{ borderBottom: i < recentRuns.length - 1 ? `1px solid ${C.border}` : 'none' }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-400">{run.datetime}</td>
                      <td
                        className={`px-3 py-3 text-xs whitespace-nowrap text-slate-600 truncate max-w-[140px] ${run.mode === 'BULK' ? 'cursor-pointer hover:underline font-semibold' : ''}`}
                        title={run.master}
                        onClick={() => {
                          if (run.mode === 'BULK') {
                            setExpandedRows(prev => ({ ...prev, [i]: !prev[i] }))
                          }
                        }}
                      >
                        {run.mode === 'BULK' ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold">{expandedRows[i] ? 'v' : '›'}</span>
                            {run.master.replace('→ ', '')}
                          </span>
                        ) : (
                          run.master
                        )}
                      </td>
                      <td
                        className={`px-3 py-3 text-xs whitespace-nowrap text-slate-600 truncate max-w-[140px] ${run.mode === 'BULK' ? 'cursor-pointer hover:underline font-semibold' : ''}`}
                        title={run.revised}
                        onClick={() => {
                          if (run.mode === 'BULK') {
                            setExpandedRows(prev => ({ ...prev, [i]: !prev[i] }))
                          }
                        }}
                      >
                        {run.mode === 'BULK' ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold">{expandedRows[i] ? 'v' : '›'}</span>
                            {run.revised.replace('→ ', '')}
                          </span>
                        ) : (
                          run.revised
                        )}
                      </td>
                      <td className="px-3 py-3"><ModeBadge mode={run.mode} /></td>
                      <td className="px-3 py-3 text-xs text-center text-slate-700">{run.pairs ?? '—'}</td>
                      <td className="px-3 py-3 text-xs text-center font-bold text-slate-800">{run.findings ?? '—'}</td>
                      <td className="px-3 py-3">{run.workflow ? <WorkflowBadge workflow={run.workflow} /> : <span style={{ color: C.muted }}>—</span>}</td>
                      <td className="px-3 py-3"><StatusBadge status={run.status} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const isBulk = run.mode === 'BULK'
                              onSetFiles?.(isBulk ? 'Master.pdf' : run.master, isBulk ? 'Revised.pdf' : run.revised, isBulk)
                              onSetLrfFlowActive(run.workflow === 'PROOF READING')
                              onSetIfuFlowActive?.(run.workflow === 'IFU DOCUMENT COMPARISON')
                              onNavigate('analysis')
                            }}
                            className="flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                            style={{ width: 26, height: 26, backgroundColor: C.grayBg }}
                            title="Preview analysis"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={C.muted} strokeWidth="1.8" />
                              <circle cx="12" cy="12" r="3" stroke={C.muted} strokeWidth="1.8" />
                            </svg>
                          </button>
                          {run.status === 'PASS' ? (
                            <button
                              onClick={() => {
                                const isIfu = run.workflow === 'IFU DOCUMENT COMPARISON'
                                const isLrfBulk = run.mode === 'BULK' && run.workflow === 'PROOF READING'
                                const file = isIfu ? '/IFU-Report.pdf' : isLrfBulk ? '/ProofX_Bulk_LRF_Report.pdf' : run.mode === 'BULK' ? '/ProofX_Bulk_Report.pdf' : '/ProofX_Report.pdf'
                                const name = isIfu ? 'IFU-Report.pdf' : isLrfBulk ? 'ProofX_Bulk_LRF_Report.pdf' : run.mode === 'BULK' ? 'ProofX_Bulk_Report.pdf' : 'ProofX_Report.pdf'
                                const a = document.createElement('a')
                                a.href = file
                                a.download = name
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                              style={{ backgroundColor: C.navyLight, color: C.navy }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M12 15V3M7 10l5 5 5-5" stroke={C.navy} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke={C.navy} strokeWidth="2.2" strokeLinecap="round" />
                              </svg>
                              Report
                            </button>
                          ) : (
                            <span style={{ color: C.muted }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRows[i] && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={9} className="px-8 py-4 border-t border-b border-slate-200">
                          <div className="w-full text-xs">
                            <div className="grid grid-cols-12 font-bold mb-2 uppercase text-slate-400 tracking-wider">
                              <div className="col-span-5">Master</div>
                              <div className="col-span-5">Revised</div>
                              <div className="col-span-2 text-right">Status</div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="grid grid-cols-12 py-1.5 text-slate-600 items-center">
                                <div className="col-span-5">Master.pdf</div>
                                <div className="col-span-5">Revised.pdf</div>
                                <div className="col-span-2 text-right">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px]">DONE</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-12 py-1.5 text-slate-600 items-center">
                                <div className="col-span-5">additional changes master.pdf</div>
                                <div className="col-span-5">additional changes revised.pdf</div>
                                <div className="col-span-2 text-right">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px]">DONE</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </div>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
        </div>
      </div>

      <footer className="text-center py-4 shrink-0">
        <p className="text-xs" style={{ color: C.muted }}>ProofX · Label Compliance</p>
      </footer>
    </div>
  )
}
