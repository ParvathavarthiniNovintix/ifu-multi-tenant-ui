import { useState } from 'react'
import { C } from '../colors'
import type { Screen } from '../App'

export type RunRow = {
  datetime: string
  master: string
  revised: string
  mode: string
  pairs: number
  skipped: number
  findings: number
  workflow: string
  status: string
}

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
  const isIfu = workflow === 'DOCUMENT COMPARISON'
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap inline-block"
      style={{
        backgroundColor: isVc ? C.orangeLight : isIfu ? '#E2E8F0' : C.navyLight,
        color: isVc ? C.orangeText : isIfu ? '#475569' : C.navy,
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

// IFU documents are validated across this many languages (mock — real detection would come from the backend)
export const IFU_LANG_COUNT = 13

type Props = {
  title?: string
  runs: RunRow[]
  // Workflow filter pills shown above the table (an "ALL" pill is always added automatically).
  // Omit or pass a single-item array to hide the filter row (nothing meaningful to filter).
  workflowOptions?: string[]
  // Shows a LANG COUNT column (IFU-only — labels have no language-set concept)
  showLangCount?: boolean
  historyScreen?: Screen
  csvFileName?: string
  onNavigate: (s: Screen) => void
  onSetFiles?: (master: string, revised: string, bulk: boolean) => void
  onSetLrfFlowActive?: (active: boolean) => void
  onSetIfuFlowActive?: (active: boolean) => void
}

export default function RecentRunsTable({
  title = 'Recent Runs',
  runs,
  workflowOptions = [],
  showLangCount = false,
  historyScreen,
  csvFileName = 'proofx-runs.csv',
  onNavigate,
  onSetFiles,
  onSetLrfFlowActive,
  onSetIfuFlowActive,
}: Props) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})
  const [workflowFilter, setWorkflowFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const showFilters = workflowOptions.length > 1

  const filteredRuns = runs.filter(r => {
    const matchesWorkflow = workflowFilter === 'ALL' || r.workflow === workflowFilter
    const matchesSearch =
      r.master.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.revised.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesWorkflow && matchesSearch
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm" style={{ color: C.text }}>{title}</h2>
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
              a.download = csvFileName
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(a.href)
            }}
          >Export CSV</button>
          {historyScreen && (
            <button
              className="text-xs font-medium cursor-pointer hover:opacity-75 transition-opacity"
              style={{ color: C.orange }}
              onClick={() => onNavigate(historyScreen)}
            >View all →</button>
          )}
        </div>
      </div>

      {/* Filters */}
      {(showFilters || true) && (
        <div className="flex items-center justify-between gap-4 mb-3">
          {showFilters ? (
            <div className="flex items-center gap-1.5">
              {(['ALL', ...workflowOptions]).map(w => (
                <button
                  key={w}
                  onClick={() => setWorkflowFilter(w)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor: workflowFilter === w ? C.navy : C.grayBg,
                    color: workflowFilter === w ? C.white : C.grayText,
                  }}
                >
                  {w === 'DOCUMENT COMPARISON' ? 'Document Comparison' : w}
                </button>
              ))}
            </div>
          ) : <div />}
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
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${C.border}`, backgroundColor: C.white }}
      >
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: C.grayBg, borderBottom: `1px solid ${C.border}` }}>
              {['DATE / TIME', 'MASTER FILE', 'REVISED FILE', 'MODE', 'PAIRS', 'FINDINGS', ...(showLangCount ? ['LANG COUNT'] : []), 'WORKFLOW', 'RUN STATUS', 'ACTIONS'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-400 tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={showLangCount ? 10 : 9} className="px-3 py-6 text-center text-xs italic" style={{ color: C.muted }}>
                  No runs yet — start a comparison above.
                </td>
              </tr>
            ) : filteredRuns.map((run, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <tr
                  style={{ borderBottom: i < filteredRuns.length - 1 ? `1px solid ${C.border}` : 'none' }}
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
                  {showLangCount && (
                    <td className="px-3 py-3 text-xs text-center font-semibold text-slate-700">{IFU_LANG_COUNT}</td>
                  )}
                  <td className="px-3 py-3">{run.workflow ? <WorkflowBadge workflow={run.workflow} /> : <span style={{ color: C.muted }}>—</span>}</td>
                  <td className="px-3 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const isBulk = run.mode === 'BULK'
                          onSetFiles?.(isBulk ? 'Master.pdf' : run.master, isBulk ? 'Revised.pdf' : run.revised, isBulk)
                          onSetLrfFlowActive?.(run.workflow === 'PROOF READING')
                          onSetIfuFlowActive?.(run.workflow === 'DOCUMENT COMPARISON')
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
                            const isIfu = run.workflow === 'DOCUMENT COMPARISON'
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
  )
}
