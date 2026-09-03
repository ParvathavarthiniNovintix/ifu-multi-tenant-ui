import { useState, Fragment } from 'react'
import NavBar from '../components/NavBar'
import AdminSidebar from '../components/AdminSidebar'
import { C } from '../colors'
import type { Screen } from '../App'

type Props = {
  onNavigate: (s: Screen) => void
  previousScreen?: Screen
  selectedProofreader?: string | null
  onSelectProofreader?: (name: string | null) => void
  userRole?: 'admin' | 'workspace-admin' | 'proofreader'
  onSetFiles?: (master: string, revised: string, bulk: boolean) => void
  onSetLrfFlowActive?: (active: boolean) => void
  onSetIfuFlowActive?: (active: boolean) => void
}

const teamMap: Record<string, { name: string; color: string; lightColor: string }> = {
  'Dhivya':   { name: 'DePuy CSV',     color: '#1C2E59', lightColor: '#e9edf6' },
  'Athmika':  { name: 'DePuy CSV',     color: '#1C2E59', lightColor: '#e9edf6' },
  'Shrvaani': { name: 'DePuy CSV',     color: '#1C2E59', lightColor: '#e9edf6' },
  'Rooban':   { name: 'DePuy CSV',     color: '#1C2E59', lightColor: '#e9edf6' },
  'Parvatha': { name: 'DePuy CSV',     color: '#1C2E59', lightColor: '#e9edf6' },
  'Ananya':   { name: 'MedTech',       color: '#f2801d', lightColor: '#fdece0' },
  'Vikram':   { name: 'MedTech',       color: '#f2801d', lightColor: '#fdece0' },
  'Priya':    { name: 'MedTech',       color: '#f2801d', lightColor: '#fdece0' },
}

const rows = [
  { datetime: 'Jul 22, 2026, 09:14 AM', proofreader: 'Dhivya',   master: '→ 2 files',       revised: '→ 2 files',        mode: 'BULK',   pairs: 2, skipped: 0, findings: 7,  workflow: 'PROOF READING', status: 'PASS', expandable: true  },
  { datetime: 'Jul 22, 2026, 08:30 AM', proofreader: 'Ananya',   master: '→ 2 files',       revised: '→ 2 files',        mode: 'BULK',   pairs: 2, skipped: 0, findings: 4,  workflow: 'VISUAL COMPARISON', status: 'PASS', expandable: true  },
  { datetime: 'Jul 21, 2026, 11:52 AM', proofreader: 'Athmika',  master: '→ 2 files',       revised: '→ 2 files',        mode: 'BULK',   pairs: 2, skipped: 0, findings: 12, workflow: 'PROOF READING', status: 'PASS', expandable: true  },
  { datetime: 'Jul 21, 2026, 10:28 AM', proofreader: 'Dhivya',   master: 'Master.pdf',      revised: 'Revised.pdf',      mode: 'SINGLE', pairs: 1,  skipped: 0, findings: 3,  workflow: 'PROOF READING',     status: 'PASS', expandable: false },
  { datetime: 'Jul 21, 2026, 09:15 AM', proofreader: 'Vikram',   master: 'LCN-label.pdf',   revised: 'LCN-label-v2.pdf', mode: 'SINGLE', pairs: 1,  skipped: 0, findings: 6,  workflow: 'PROOF READING',     status: 'PASS', expandable: false },
  { datetime: 'Jul 20, 2026, 03:12 PM', proofreader: 'Shrvaani', master: '→ 2 files',       revised: '→ 2 files',        mode: 'BULK',   pairs: 2, skipped: 0, findings: 0,  workflow: 'VISUAL COMPARISON', status: 'PASS', expandable: true  },
  { datetime: 'Jul 20, 2026, 01:45 PM', proofreader: 'Priya',    master: 'Master.pdf',      revised: 'Revised.pdf',      mode: 'SINGLE', pairs: 1,  skipped: 0, findings: 2,  workflow: 'PROOF READING',     status: 'PASS', expandable: false },
  { datetime: 'Jul 19, 2026, 08:44 AM', proofreader: 'Rooban',   master: 'LCN-label.pdf',   revised: 'LCN-label-v2.pdf', mode: 'SINGLE', pairs: 1,  skipped: 0, findings: 5,  workflow: 'PROOF READING',     status: 'PASS', expandable: false },
  { datetime: 'Jul 18, 2026, 02:30 PM', proofreader: 'Parvatha', master: '→ 2 files',       revised: '→ 2 files',        mode: 'BULK',   pairs: 2, skipped: 0, findings: 18, workflow: 'VISUAL COMPARISON', status: 'PASS', expandable: true  },
  { datetime: 'Jul 17, 2026, 08:17 PM', proofreader: 'Dhivya',   master: '→ 2 files',       revised: '→ 2 files',        mode: 'BULK',   pairs: 2, skipped: 1, findings: 4,  workflow: 'VISUAL COMPARISON', status: 'PASS', expandable: true  },
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

export default function AdminHistoryScreen({
  onNavigate,
  previousScreen,
  selectedProofreader,
  onSelectProofreader,
  userRole,
  onSetFiles,
  onSetLrfFlowActive,
  onSetIfuFlowActive,
}: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 5

  const toggleRow = (i: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const isWorkspaceAdmin = userRole === 'workspace-admin'
  const depuyMembers = ['Dhivya', 'Athmika', 'Shrvaani', 'Shrvaani', 'Rooban', 'Parvatha']

  const visibleRows = isWorkspaceAdmin
    ? rows.filter(r => depuyMembers.includes(r.proofreader))
    : rows

  // Filter rows based on selected proofreader (flexible name matching)
  const filteredRows = selectedProofreader
    ? visibleRows.filter(r => r.proofreader.toLowerCase().includes(selectedProofreader.toLowerCase().split(' ')[0]))
    : visibleRows

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in" style={{ backgroundColor: C.bg }}>
      <NavBar
        title="Run History"
        showProfile
        onProfileClick={() => onNavigate('profile')}
        onLogout={() => onNavigate('login')}
        profileName={isWorkspaceAdmin ? 'Dhivya' : 'Admin'}
        profileInitials={isWorkspaceAdmin ? 'D' : 'A'}
        rightNode={
          <button
            className="text-xs ml-4 font-medium hover:opacity-80 transition-all cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onClick={() => {
              const headers = ['Date / Time', 'Proofreader', 'Master', 'Revised', 'Mode', 'Pairs', 'Skipped', 'Findings', 'Workflow', 'Run status']
              const csvRows = filteredRows.map(r =>
                [r.datetime, r.proofreader, r.master, r.revised, r.mode, r.pairs, r.skipped, r.findings, r.workflow, r.status]
                  .map(v => `"${v}"`).join(',')
              )
              const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'proofx-history.csv'
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

      {/* Main layout with sidebar */}
      <div className="flex flex-1 overflow-hidden">
      <AdminSidebar active="history" userRole={isWorkspaceAdmin ? 'workspace-admin' : 'admin'} onNavigate={onNavigate} />
      <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-8 flex flex-col gap-5 w-full" style={{ maxWidth: 1300, margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-bold text-xl text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>Run History</h1>
            <p className="text-xs mt-0.5 text-slate-400">
              {isWorkspaceAdmin ? 'All runs for DePuy CSV Team' : 'All runs across all proofreaders'}
            </p>
          </div>

          {/* Selected Proofreader Filter Indicator */}
          {selectedProofreader && (
            <div className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <span>Showing runs by: <strong>{selectedProofreader}</strong></span>
              <button
                onClick={() => onSelectProofreader?.(null)}
                className="hover:opacity-75 cursor-pointer ml-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div
          className="rounded-xl overflow-hidden border border-slate-200 shadow-sm"
          style={{ backgroundColor: C.white }}
        >
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: C.grayBg, borderBottom: `1px solid ${C.border}` }}>
                {['', 'DATE / TIME', 'PROOFREADER', ...(!isWorkspaceAdmin ? ['TEAM'] : []), 'MASTER', 'REVISED', 'MODE', 'PAIRS', 'SKIPPED', 'FINDINGS', 'WORKFLOW', 'RUN STATUS', 'PREVIEW', 'DOWNLOAD'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-400 tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={isWorkspaceAdmin ? 13 : 14} className="px-5 py-8 text-center text-xs text-slate-400 italic">
                    No runs recorded.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, i) => (
                  <Fragment key={i}>
                    <tr
                      className="hover:bg-slate-50 transition-colors"
                      style={{ borderBottom: !expandedRows.has(i) && i < pagedRows.length - 1 ? `1px solid ${C.border}` : 'none' }}
                    >
                      {/* Expand toggle */}
                      <td className="px-3 py-3 w-8">
                        {row.expandable && (
                          <button
                            onClick={() => toggleRow(i)}
                            className="flex items-center justify-center rounded hover:opacity-70 cursor-pointer"
                            style={{
                              width: 22,
                              height: 22,
                              backgroundColor: C.grayBg,
                              color: C.muted,
                              fontSize: 12,
                              transform: expandedRows.has(i) ? 'rotate(90deg)' : 'none',
                              transition: 'transform 0.15s',
                            }}
                          >
                            ›
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-400">{row.datetime}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold text-slate-700">{row.proofreader}</span>
                      </td>
                      {!isWorkspaceAdmin && (
                        <td className="px-3 py-3">
                          {(() => {
                            const team = teamMap[row.proofreader]
                            return team ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                                style={{ backgroundColor: team.lightColor, color: team.color }}
                              >
                                {team.name}
                              </span>
                            ) : null
                          })()}
                        </td>
                      )}
                      <td className="px-3 py-3 text-xs text-slate-600 truncate max-w-[120px]">{row.master}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 truncate max-w-[120px]">{row.revised}</td>
                      <td className="px-3 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: row.mode === 'BULK' ? C.navyLight : C.grayBg, color: row.mode === 'BULK' ? C.navy : C.grayText }}
                        >
                          {row.mode}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-center text-slate-700">{row.pairs}</td>
                      <td className="px-3 py-3 text-xs text-center font-semibold" style={{ color: row.skipped > 0 ? C.red : C.muted }}>{row.skipped}</td>
                      <td className="px-3 py-3 text-xs text-center font-bold text-slate-800">{row.findings}</td>
                      <td className="px-3 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: row.workflow === 'VISUAL COMPARISON' ? C.orangeLight : C.navyLight, color: row.workflow === 'VISUAL COMPARISON' ? C.orangeText : C.navy }}
                        >
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
                            onSetFiles?.(isBulk ? 'Master.pdf' : row.master, isBulk ? 'Revised.pdf' : row.revised, isBulk)
                            onSetLrfFlowActive?.(row.workflow === 'PROOF READING')
                            onSetIfuFlowActive?.(row.workflow === 'IFU DOCUMENT COMPARISON')
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
                    {/* Expanded pair breakdown */}
                    {expandedRows.has(i) && row.expandable && (
                      <tr style={{ backgroundColor: C.grayBg, borderBottom: `2px solid ${C.border}` }}>
                        <td colSpan={isWorkspaceAdmin ? 13 : 14} className="px-8 py-4">
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

        {/* Pagination */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); setExpandedRows(new Set()) }}
              disabled={page === 1}
              className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer"
              style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, color: page === 1 ? C.muted : C.text, opacity: page === 1 ? 0.5 : 1 }}
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setExpandedRows(new Set()) }}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer"
              style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, color: page === totalPages ? C.muted : C.text, opacity: page === totalPages ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
      </div>
      </div>

    </div>
  )
}
