import { useState, Fragment } from 'react'
import NavBar from '../components/NavBar'
import { C } from '../colors'
import type { Screen } from '../App'

type Props = {
  onNavigate: (s: Screen) => void
  previousScreen?: Screen
  onSetFiles?: (master: string, revised: string, bulk: boolean) => void
  onSetLrfFlowActive?: (active: boolean) => void
}

const rows = [
  { datetime: 'Jul 23, 2026, 02:02 PM', master: 'Master.pdf', revised: 'Revised.pdf', mode: 'SINGLE', pairs: 1, skipped: 0, findings: 0, workflow: 'PROOF READING', status: 'PASS', expandable: false, bulkMasterKey: 'Master.pdf', bulkRevisedKey: 'Revised.pdf' },
  { datetime: 'Jul 21, 2026, 11:52 AM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 0, findings: 12, workflow: 'PROOF READING', status: 'PASS', expandable: true, bulkMasterKey: 'Master.pdf', bulkRevisedKey: 'Revised.pdf' },
  { datetime: 'Jul 21, 2026, 10:52 AM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 0, findings: 1, workflow: 'PROOF READING', status: 'PASS', expandable: true, bulkMasterKey: 'Master.pdf', bulkRevisedKey: 'Revised.pdf' },
  { datetime: 'Jul 17, 2026, 08:17 PM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 1, findings: 4, workflow: 'VISUAL COMPARISON', status: 'PASS', expandable: true, bulkMasterKey: 'Master.pdf', bulkRevisedKey: 'Revised.pdf' },
  { datetime: 'Jul 14, 2026, 03:45 PM', master: 'LCN-label.pdf', revised: 'LCN-label-v2.pdf', mode: 'SINGLE', pairs: 1, skipped: 0, findings: 5, workflow: 'PROOF READING', status: 'PASS', expandable: false, bulkMasterKey: 'LCN-label.pdf', bulkRevisedKey: 'LCN-label-v2.pdf' },
  { datetime: 'Jul 10, 2026, 10:20 AM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 0, findings: 9, workflow: 'VISUAL COMPARISON', status: 'PASS', expandable: true, bulkMasterKey: 'Master.pdf', bulkRevisedKey: 'Revised.pdf' },
  { datetime: 'Jul 7, 2026, 09:05 AM', master: 'Master.pdf', revised: 'Revised.pdf', mode: 'SINGLE', pairs: 1, skipped: 0, findings: 3, workflow: 'PROOF READING', status: 'PASS', expandable: false, bulkMasterKey: 'Master.pdf', bulkRevisedKey: 'Revised.pdf' },
  { datetime: 'Aug 1, 2026, 09:38 AM', master: 'IFU-current.pdf', revised: 'IFU-revised.pdf', mode: 'SINGLE', pairs: 1, skipped: 0, findings: 11, workflow: 'IFU DOCUMENT COMPARISON', status: 'PASS', expandable: false, bulkMasterKey: 'IFU-current.pdf', bulkRevisedKey: 'IFU-revised.pdf' },
  { datetime: 'Aug 3, 2026, 03:24 PM', master: '→ 2 files', revised: '→ 2 files', mode: 'BULK', pairs: 2, skipped: 1, findings: 9, workflow: 'IFU DOCUMENT COMPARISON', status: 'PASS', expandable: true, bulkMasterKey: 'IFU-current.pdf', bulkRevisedKey: 'IFU-revised.pdf' },
]

const pairNames = [
  { m: 'Master.pdf', r: 'Revised.pdf' },
  { m: 'additional changes master.pdf', r: 'additional changes revised.pdf' },
]

function getPairFiles(row: { pairs: number; skipped: number }) {
  return pairNames.slice(0, row.pairs).map((f, i) => ({
    ...f,
    status: i < row.skipped ? 'SKIPPED' : 'DONE',
  }))
}

export default function ProofreaderHistoryScreen({ onNavigate, previousScreen, onSetFiles, onSetLrfFlowActive }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [workflowFilter, setWorkflowFilter] = useState<'ALL' | 'VISUAL COMPARISON' | 'PROOF READING' | 'IFU DOCUMENT COMPARISON'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page] = useState(1)

  const toggleRow = (i: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const filteredRows = rows.filter(r => {
    const matchesWorkflow = workflowFilter === 'ALL' || r.workflow === workflowFilter
    const matchesSearch =
      r.master.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.revised.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesWorkflow && matchesSearch
  })

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in" style={{ backgroundColor: C.bg }}>
      <NavBar
        showBack
        onBack={() => onNavigate(previousScreen === 'proofreader-dashboard' ? 'proofreader-dashboard' : 'proofreader-dashboard')}
        title="Run History"
        showProfile
        onProfileClick={() => onNavigate('profile')}
        onLogout={() => onNavigate('login')}
        profileName="Athmika"
        profileInitials="A"
        rightNode={
          <button
            className="text-xs ml-4 font-medium hover:opacity-80 transition-all cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onClick={() => {
              const headers = ['Date / Time', 'Master', 'Revised', 'Mode', 'Pairs', 'Skipped', 'Findings', 'Workflow', 'Status']
              const csvRows = filteredRows.map(r =>
                [r.datetime, r.master, r.revised, r.mode, r.pairs, r.skipped, r.findings, r.workflow, r.status]
                  .map(v => `"${v}"`).join(',')
              )
              const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'proofx-my-history.csv'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(a.href)
            }}
          >
            Export CSV
          </button>
        }
      />

      <div className="overflow-y-auto flex-1">
          <div className="px-8 py-8 flex flex-col gap-5 w-full" style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="font-bold text-xl text-slate-800">Run History</h1>
                <p className="text-xs mt-0.5 text-slate-400">All your label comparison runs</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-4">
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

            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ backgroundColor: C.white }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: C.grayBg, borderBottom: `1px solid ${C.border}` }}>
                      {['', 'DATE / TIME', 'MASTER', 'REVISED', 'MODE', 'PAIRS', 'SKIPPED', 'FINDINGS', 'WORKFLOW', 'STATUS', 'PREVIEW', 'DOWNLOAD'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-400 tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-5 py-8 text-center text-xs text-slate-400 italic">
                          No runs found.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, i) => (
                        <Fragment key={i}>
                          <tr
                            className="hover:bg-slate-50 transition-colors"
                            style={{ borderBottom: !expandedRows.has(i) && i < filteredRows.length - 1 ? `1px solid ${C.border}` : 'none' }}
                          >
                            <td className="px-3 py-3 w-8">
                              {row.expandable && (
                                <button
                                  onClick={() => toggleRow(i)}
                                  className="flex items-center justify-center rounded hover:opacity-70 cursor-pointer"
                                  style={{
                                    width: 22, height: 22,
                                    backgroundColor: C.grayBg, color: C.muted, fontSize: 12,
                                    transform: expandedRows.has(i) ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.15s',
                                  }}
                                >
                                  ›
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-400">{row.datetime}</td>
                            <td className="px-3 py-3 text-xs text-slate-600 truncate max-w-[120px]">{row.master}</td>
                            <td className="px-3 py-3 text-xs text-slate-600 truncate max-w-[120px]">{row.revised}</td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ backgroundColor: row.mode === 'BULK' ? C.navyLight : C.grayBg, color: row.mode === 'BULK' ? C.navy : C.grayText }}>
                                {row.mode}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-xs text-center text-slate-700">{row.pairs}</td>
                            <td className="px-3 py-3 text-xs text-center font-semibold" style={{ color: row.skipped > 0 ? C.red : C.muted }}>{row.skipped}</td>
                            <td className="px-3 py-3 text-xs text-center font-bold text-slate-800">{row.findings}</td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ backgroundColor: row.workflow === 'VISUAL COMPARISON' ? C.orangeLight : C.navyLight, color: row.workflow === 'VISUAL COMPARISON' ? C.orangeText : C.navy }}>
                                {row.workflow}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">{row.status}</span>
                            </td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() => {
                                  const isBulk = row.mode === 'BULK'
                                  // For bulk history preview, pass the first pair's names; historyPreview=true → 2-pair view
                                  onSetFiles?.(isBulk ? row.bulkMasterKey : row.master, isBulk ? row.bulkRevisedKey : row.revised, isBulk)
                                  onSetLrfFlowActive?.(row.workflow === 'PROOF READING')
                                  onNavigate('analysis')
                                }}
                                className="flex items-center justify-center rounded hover:opacity-70 cursor-pointer"
                                style={{ width: 28, height: 28, backgroundColor: C.grayBg }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={C.muted} strokeWidth="1.8" />
                                  <circle cx="12" cy="12" r="3" stroke={C.muted} strokeWidth="1.8" />
                                </svg>
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() => {
                                  const isLrfBulk = row.mode === 'BULK' && row.workflow === 'PROOF READING'
                                  const file = isLrfBulk ? '/ProofX_Bulk_LRF_Report.pdf' : row.mode === 'BULK' ? '/ProofX_Bulk_Report.pdf' : '/ProofX_Report.pdf'
                                  const name = isLrfBulk ? 'ProofX_Bulk_LRF_Report.pdf' : row.mode === 'BULK' ? 'ProofX_Bulk_Report.pdf' : 'ProofX_Report.pdf'
                                  const a = document.createElement('a')
                                  a.href = file
                                  a.download = name
                                  document.body.appendChild(a)
                                  a.click()
                                  document.body.removeChild(a)
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                                style={{ backgroundColor: C.navyLight, color: C.navy }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 15V3M7 10l5 5 5-5" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke={C.navy} strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                PDF
                              </button>
                            </td>
                          </tr>
                          {expandedRows.has(i) && row.expandable && (
                            <tr style={{ backgroundColor: C.grayBg, borderBottom: `2px solid ${C.border}` }}>
                              <td colSpan={12} className="px-8 py-4">
                                <div className="w-full text-xs">
                                  <div className="grid grid-cols-12 font-bold mb-2 uppercase text-slate-400 tracking-wider">
                                    <div className="col-span-5">Master</div>
                                    <div className="col-span-5">Revised</div>
                                    <div className="col-span-2 text-right">Status</div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {getPairFiles(row).map((f, fi) => (
                                      <div key={fi} className="grid grid-cols-12 py-1.5 text-slate-600 items-center">
                                        <div className="col-span-5">{f.m}</div>
                                        <div className="col-span-5">{f.r}</div>
                                        <div className="col-span-2 text-right">
                                          {f.status === 'SKIPPED' ? (
                                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold text-[10px]">SKIPPED</span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px]">DONE</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer"
                  style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, color: C.muted }}>
                  ← Prev
                </button>
                <span className="text-xs text-slate-400">Page {page} of 3</span>
                <button className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer"
                  style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, color: C.text }}>
                  Next →
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
