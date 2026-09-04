import { useState, ReactNode } from 'react'
import NavBar from '../components/NavBar'
import AdminSidebar from '../components/AdminSidebar'
import ModuleSwitcher, { type Module } from '../components/ModuleSwitcher'
import { C } from '../colors'
import type { Screen } from '../App'

type Props = {
  onNavigate: (s: Screen) => void
  onSelectProofreader: (name: string | null) => void
  onSetFiles?: (master: string, revised: string, bulk: boolean) => void
  onSetLrfFlowActive?: (active: boolean) => void
  onSetIfuFlowActive?: (active: boolean) => void
  adminModule: Module
  onSetAdminModule: (m: Module) => void
}

const LABEL_WORKFLOWS = ['VISUAL COMPARISON', 'PROOF READING'] as const
const IFU_WORKFLOWS = ['DOCUMENT COMPARISON'] as const
// IFU documents are validated across this many languages (mock — real detection would come from the backend)
const IFU_LANG_COUNT = 13

const labelFlashCards = [
  {
    label: 'Total Runs',
    value: '127',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="white" strokeWidth="1.6" fill="none" />
        <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #1e2a52 0%, #344782 100%)',
    sub: '+12 this week',
  },
  {
    label: 'Team Members',
    value: '5',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3.5" stroke="white" strokeWidth="1.6" />
        <path d="M2 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="17" cy="8" r="2.5" stroke="white" strokeWidth="1.4" />
        <path d="M22 20c0-2.76-2.24-5-5-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #2d3e7a 0%, #455ba6 100%)',
    sub: '3 active today',
  },
  {
    label: 'Avg Findings / Run',
    value: '8.4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 18l5-5 4 4 9-9" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #394fa0 0%, #526cc7 100%)',
    sub: 'Visual comparison + proof reading',
  },
  {
    label: 'Reports Exported',
    value: '89',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 15V3M7 10l5 5 5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #253266 0%, #3e4f94 100%)',
    sub: 'PDF + CSV combined',
  },
]

const ifuFlashCards = [
  {
    label: 'Total Runs',
    value: '34',
    icon: labelFlashCards[0].icon,
    gradient: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    sub: '+4 this week',
  },
  {
    label: 'Team Members',
    value: '5',
    icon: labelFlashCards[1].icon,
    gradient: 'linear-gradient(135deg, #334155 0%, #94A3B8 100%)',
    sub: '3 active today',
  },
  {
    label: 'Avg Findings / Run',
    value: '11.2',
    icon: labelFlashCards[2].icon,
    gradient: 'linear-gradient(135deg, #475569 0%, #CBD5E1 100%)',
    sub: 'Across current IFU runs',
  },
  {
    label: 'Reports Exported',
    value: '22',
    icon: labelFlashCards[3].icon,
    gradient: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    sub: 'Inspection reports (PDF)',
  },
]

const teamMap: Record<string, { name: string; color: string; lightColor: string }> = {
  'Dhivya':   { name: 'DePuy CSV',  color: '#1C2E59', lightColor: '#e9edf6' },
  'Athmika':  { name: 'DePuy CSV',  color: '#1C2E59', lightColor: '#e9edf6' },
  'Shrvaani': { name: 'DePuy CSV',  color: '#1C2E59', lightColor: '#e9edf6' },
  'Rooban':   { name: 'DePuy CSV',  color: '#1C2E59', lightColor: '#e9edf6' },
  'Parvatha': { name: 'DePuy CSV',  color: '#1C2E59', lightColor: '#e9edf6' },
  'Ananya':   { name: 'MedTech',    color: '#f2801d', lightColor: '#fdece0' },
  'Vikram':   { name: 'MedTech',    color: '#f2801d', lightColor: '#fdece0' },
  'Priya':    { name: 'MedTech',    color: '#f2801d', lightColor: '#fdece0' },
}

const historyRows = [
  { datetime: 'Jul 22, 2026, 09:14 AM', proofreader: 'Dhivya',   master: '→ 2 files',     revised: '→ 2 files',        mode: 'BULK',   pairs: 2, findings: 7,  workflow: 'PROOF READING', status: 'PASS' },
  { datetime: 'Jul 22, 2026, 08:30 AM', proofreader: 'Ananya',   master: '→ 2 files',     revised: '→ 2 files',        mode: 'BULK',   pairs: 2, findings: 4,  workflow: 'VISUAL COMPARISON', status: 'PASS' },
  { datetime: 'Jul 21, 2026, 11:52 AM', proofreader: 'Athmika',  master: '→ 2 files',     revised: '→ 2 files',        mode: 'BULK',   pairs: 2, findings: 12, workflow: 'PROOF READING', status: 'PASS' },
  { datetime: 'Jul 21, 2026, 10:28 AM', proofreader: 'Dhivya',   master: 'Master.pdf',     revised: 'Revised.pdf',      mode: 'SINGLE', pairs: 1,  findings: 3,  workflow: 'PROOF READING',     status: 'PASS' },
  { datetime: 'Jul 21, 2026, 09:15 AM', proofreader: 'Vikram',   master: 'LCN-label.pdf',  revised: 'LCN-label-v2.pdf', mode: 'SINGLE', pairs: 1,  findings: 6,  workflow: 'PROOF READING',     status: 'PASS' },
  { datetime: 'Jul 20, 2026, 03:12 PM', proofreader: 'Shrvaani', master: '→ 2 files',     revised: '→ 2 files',        mode: 'BULK',   pairs: 2, findings: 0,  workflow: 'VISUAL COMPARISON', status: 'PASS' },
  { datetime: 'Jul 20, 2026, 01:45 PM', proofreader: 'Priya',    master: 'Master.pdf',     revised: 'Revised.pdf',      mode: 'SINGLE', pairs: 1,  findings: 2,  workflow: 'PROOF READING',     status: 'PASS' },
  { datetime: 'Jul 19, 2026, 08:44 AM', proofreader: 'Rooban',   master: 'LCN-label.pdf',  revised: 'LCN-label-v2.pdf', mode: 'SINGLE', pairs: 1,  findings: 5,  workflow: 'PROOF READING',     status: 'PASS' },
  { datetime: 'Aug 01, 2026, 09:38 AM', proofreader: 'Athmika',  master: 'IFU-current.pdf', revised: 'IFU-revised.pdf',   mode: 'SINGLE', pairs: 1,  findings: 11, workflow: 'DOCUMENT COMPARISON', status: 'PASS' },
  { datetime: 'Aug 03, 2026, 03:24 PM', proofreader: 'Dhivya',   master: 'IFU-current.pdf', revised: 'IFU-revised.pdf', mode: 'SINGLE', pairs: 1, findings: 9,  workflow: 'DOCUMENT COMPARISON', status: 'PASS' },
]

const labelAnalyticsData = [
  { day: 'Thu', runs: 12 },
  { day: 'Fri', runs: 18 },
  { day: 'Sat', runs: 15 },
  { day: 'Sun', runs: 9 },
  { day: 'Mon', runs: 22 },
  { day: 'Tue', runs: 28 },
  { day: 'Wed', runs: 23 },
]

const ifuAnalyticsData = [
  { day: 'Thu', runs: 3 },
  { day: 'Fri', runs: 5 },
  { day: 'Sat', runs: 4 },
  { day: 'Sun', runs: 2 },
  { day: 'Mon', runs: 6 },
  { day: 'Tue', runs: 8 },
  { day: 'Wed', runs: 6 },
]

function Badge({ children, bg, color }: { children: ReactNode; bg: string; color: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap" style={{ backgroundColor: bg, color }}>
      {children}
    </span>
  )
}

export default function AdminDashboardScreen({ onNavigate, onSelectProofreader, onSetFiles, onSetLrfFlowActive, onSetIfuFlowActive, adminModule, onSetAdminModule }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [workflowFilter, setWorkflowFilter] = useState<'ALL' | 'VISUAL COMPARISON' | 'PROOF READING' | 'DOCUMENT COMPARISON'>('ALL')
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  const isIfuModule = adminModule === 'ifu'
  const moduleWorkflows = isIfuModule ? IFU_WORKFLOWS : LABEL_WORKFLOWS
  const flashCards = isIfuModule ? ifuFlashCards : labelFlashCards
  const analyticsData = isIfuModule ? ifuAnalyticsData : labelAnalyticsData

  const moduleRows = historyRows.filter(row => (moduleWorkflows as readonly string[]).includes(row.workflow))

  const filteredRows = moduleRows.filter(row => {
    const matchesSearch =
      row.proofreader.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.master.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.revised.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesWorkflow =
      workflowFilter === 'ALL' || row.workflow === workflowFilter

    return matchesSearch && matchesWorkflow
  }).slice(0, 5)

  // SVG Chart Config
  const chartWidth = 500
  const chartHeight = 120
  const paddingX = 40
  const paddingY = 20
  const pointsCount = analyticsData.length
  const stepX = (chartWidth - paddingX * 2) / (pointsCount - 1)
  const maxRuns = Math.max(...analyticsData.map(d => d.runs))
  const stepY = (chartHeight - paddingY * 2) / maxRuns

  // Compute point coordinates
  const points = analyticsData.map((d, i) => ({
    x: paddingX + i * stepX,
    y: chartHeight - paddingY - d.runs * stepY,
    ...d
  }))

  // Construct path coordinates
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    // Smooth bezier curve helper
    const prev = points[i - 1]
    const cpX1 = prev.x + stepX / 2
    const cpY1 = prev.y
    const cpX2 = p.x - stepX / 2
    const cpY2 = p.y
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`
  }, '')

  // Area path for gradient fill underneath
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in" style={{ backgroundColor: C.bg }}>
      <NavBar
        title="Tenant Admin Dashboard"
        showProfile
        onProfileClick={() => onNavigate('profile')}
        onLogout={() => onNavigate('login')}
        profileName="Admin"
        profileInitials="A"
        rightNode={
          <ModuleSwitcher
            value={adminModule}
            onChange={m => { onSetAdminModule(m); setWorkflowFilter('ALL'); setSearchQuery('') }}
          />
        }
      />

      <div className="flex flex-1 overflow-hidden">
      <AdminSidebar active="dashboard" userRole="admin" onNavigate={onNavigate} />
      <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-8 flex flex-col gap-6 w-full" style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Top Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bold text-2xl text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              Welcome back, Admin
            </h1>
            <p className="text-sm text-slate-500">
              Monitor {isIfuModule ? 'IFU document comparison' : 'label'} compliance runs and manage your proofreaders.
            </p>
          </div>
          <button
            onClick={() => onNavigate('team-members')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all hover:bg-slate-50 cursor-pointer"
            style={{ borderColor: C.border, color: C.navy }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke={C.navy} strokeWidth="1.8"/>
              <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M18 10l2 2 3-3" stroke={C.orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Invite Proofreaders
          </button>
        </div>

        {/* Flash cards */}
        <div className="grid grid-cols-4 gap-5">
          {flashCards.map(card => (
            <div
              key={card.label}
              className="rounded-xl p-5 flex items-start justify-between border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg select-none"
              style={{
                background: card.gradient,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 12px rgba(30, 42, 82, 0.05)'
              }}
            >
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-white tracking-tight">{card.value}</p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.sub}</p>
              </div>
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Section & Summary */}
        <div className="grid grid-cols-3 gap-6">
          {/* Analytics Chart */}
          <div className="col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Compliance Runs Over Time</h3>
                <p className="text-xs text-slate-400">Total automated {isIfuModule ? 'IFU document comparison' : 'label comparison'} runs per day</p>
              </div>
              {hoveredDataPoint !== null && (
                <div className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-md font-semibold">
                  {analyticsData[hoveredDataPoint].day}: {analyticsData[hoveredDataPoint].runs} runs
                </div>
              )}
            </div>

            <div className="relative w-full flex items-center justify-center">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#394fa0" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#394fa0" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#f1f3f9" strokeWidth="1" />
                <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#f1f3f9" strokeWidth="1" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#e2e8f0" strokeWidth="1.2" />

                {/* Gradient Fill Under Curve */}
                <path d={areaD} fill="url(#chartGradient)" />

                {/* Curved Chart Line */}
                <path d={pathD} fill="none" stroke="#394fa0" strokeWidth="2.5" strokeLinecap="round" />

                {/* Interaction points */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredDataPoint === idx ? 6 : 4}
                      fill={hoveredDataPoint === idx ? C.orange : '#394fa0'}
                      stroke="white"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredDataPoint(idx)}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    />
                    <text
                      x={p.x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className="text-[10px] font-medium fill-slate-400"
                    >
                      {p.day}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Quick Stats list */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 mb-3">Workspace Health</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-500">Active Workspaces</span>
                  <span className="text-xs font-bold text-slate-800">2 Teams</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs text-slate-500">Pending Invites</span>
                  <span className="text-xs font-bold text-amber-600">1 User</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('team-members')}
              className="w-full py-2.5 rounded-lg text-xs font-bold text-center border transition-all hover:bg-slate-50 active:scale-98 cursor-pointer"
              style={{ borderColor: C.border, color: C.navy }}
            >
              Manage Workspaces &amp; Teams →
            </button>
          </div>
        </div>

        {/* Recent activity header & controls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-base text-slate-800">Recent Activity Log</h2>
                <p className="text-xs text-slate-400">All {isIfuModule ? 'IFU document comparisons' : 'label comparisons'} completed across your teams</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-all cursor-pointer"
                  style={{ color: C.muted }}
                  onClick={() => {
                    const headers = ['Date / Time', 'Proofreader', 'Master', 'Revised', 'Mode', 'Pairs', 'Findings', 'Workflow', 'Run status']
                    const csvRows = filteredRows.map(r =>
                      [r.datetime, r.proofreader, r.master, r.revised, r.mode, r.pairs, r.findings, r.workflow, r.status]
                        .map(v => `"${v}"`).join(',')
                    )
                    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' })
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = 'proofx-activity-log.csv'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(a.href)
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15V3M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={() => onNavigate('admin-history')}
                  className="text-xs font-semibold hover:opacity-80 transition-all cursor-pointer"
                  style={{ color: C.orange }}
                >
                  View all →
                </button>
              </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex items-center justify-between gap-4">
              {/* Workflow filters — scoped to the selected module */}
              <div className="flex items-center gap-1.5">
                {(isIfuModule ? moduleWorkflows : (['ALL', ...moduleWorkflows] as const)).map(w => (
                  <button
                    key={w}
                    onClick={() => setWorkflowFilter(w)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    style={{
                      backgroundColor: workflowFilter === w ? C.navy : C.grayBg,
                      color: workflowFilter === w ? 'white' : C.muted
                    }}
                  >
                    {w === 'ALL' ? 'All Workflows' : w === 'VISUAL COMPARISON' ? 'Visual Compare' : w === 'PROOF READING' ? 'Proof Reading' : 'Document Comparison'}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-64">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* History table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed" style={{ minWidth: 900 }}>
              <colgroup>
                <col style={{ width: '12%' }} />{/* DATE / TIME */}
                <col style={{ width: '8%' }} /> {/* PROOFREADER */}
                <col style={{ width: '7%' }} /> {/* TEAM */}
                <col style={{ width: '9%' }} /> {/* MASTER FILE */}
                <col style={{ width: '9%' }} /> {/* REVISED FILE */}
                <col style={{ width: '6%' }} /> {/* MODE */}
                <col style={{ width: '5%' }} /> {/* PAIRS */}
                <col style={{ width: '6%' }} /> {/* FINDINGS */}
                {isIfuModule && <col style={{ width: '7%' }} />}{/* LANG COUNT */}
                <col style={{ width: '13%' }} />{/* WORKFLOW */}
                <col style={{ width: '9%' }} /> {/* RUN STATUS */}
                <col style={{ width: '9%' }} />{/* ACTIONS */}
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: C.grayBg, borderBottom: `1px solid ${C.border}` }}>
                  {['DATE / TIME', 'PROOFREADER', 'TEAM', 'MASTER FILE', 'REVISED FILE', 'MODE', 'PAIRS', 'FINDINGS', ...(isIfuModule ? ['LANG COUNT'] : []), 'WORKFLOW', 'RUN STATUS', 'ACTIONS'].map(h => (
                    <th key={h} className="px-2 py-2.5 text-left text-xs font-bold text-slate-400 tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={isIfuModule ? 12 : 11} className="px-3 py-8 text-center text-xs text-slate-400 italic">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <tr
                        className="hover:bg-slate-50 transition-colors"
                        style={{ borderBottom: i < filteredRows.length - 1 ? `1px solid ${C.border}` : 'none' }}
                      >
                        <td className="px-2 py-3 text-xs text-slate-400 truncate" title={row.datetime}>{row.datetime}</td>
                        <td className="px-2 py-3 font-semibold text-xs text-slate-700">
                          <button
                            onClick={() => {
                              onSelectProofreader(row.proofreader)
                              onNavigate('admin-history')
                            }}
                            className="hover:underline text-slate-700 font-semibold cursor-pointer text-left"
                          >
                            {row.proofreader}
                          </button>
                        </td>
                        <td className="px-2 py-3">
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
                        <td
                          className={`px-2 py-3 text-xs text-slate-600 truncate ${row.mode === 'BULK' ? 'cursor-pointer hover:underline font-semibold' : ''}`}
                          title={row.master}
                          onClick={() => {
                            if (row.mode === 'BULK') {
                              setExpandedRows(prev => ({ ...prev, [i]: !prev[i] }))
                            }
                          }}
                        >
                          {row.mode === 'BULK' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-bold">{expandedRows[i] ? 'v' : '›'}</span>
                              {row.master.replace('→ ', '')}
                            </span>
                          ) : (
                            row.master
                          )}
                        </td>
                        <td
                          className={`px-2 py-3 text-xs text-slate-600 truncate ${row.mode === 'BULK' ? 'cursor-pointer hover:underline font-semibold' : ''}`}
                          title={row.revised}
                          onClick={() => {
                            if (row.mode === 'BULK') {
                              setExpandedRows(prev => ({ ...prev, [i]: !prev[i] }))
                            }
                          }}
                        >
                          {row.mode === 'BULK' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-bold">{expandedRows[i] ? 'v' : '›'}</span>
                              {row.revised.replace('→ ', '')}
                            </span>
                          ) : (
                            row.revised
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <Badge bg={row.mode === 'BULK' ? C.navyLight : C.grayBg} color={row.mode === 'BULK' ? C.navy : C.grayText}>
                            {row.mode}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 text-xs text-center text-slate-700">{row.pairs}</td>
                        <td className="px-2 py-3 text-xs text-center font-bold text-slate-800">{row.findings}</td>
                        {isIfuModule && (
                          <td className="px-2 py-3 text-xs text-center font-semibold text-slate-700">{IFU_LANG_COUNT}</td>
                        )}
                        <td className="px-2 py-3">
                          <Badge
                            bg={row.workflow === 'VISUAL COMPARISON' ? C.orangeLight : row.workflow === 'DOCUMENT COMPARISON' ? '#F1F5F9' : C.navyLight}
                            color={row.workflow === 'VISUAL COMPARISON' ? C.orangeText : row.workflow === 'DOCUMENT COMPARISON' ? '#475569' : C.navy}
                          >
                            {row.workflow}
                          </Badge>
                        </td>
                        <td className="px-2 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {row.status}
                          </span>
                        </td>
                        {/* Action buttons (Preview Eye and Download Report) */}
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const isBulk = row.mode === 'BULK'
                                onSetFiles?.(isBulk ? 'Master.pdf' : row.master, isBulk ? 'Revised.pdf' : row.revised, isBulk)
                                onSetLrfFlowActive?.(row.workflow === 'PROOF READING')
                                onSetIfuFlowActive?.(row.workflow === 'DOCUMENT COMPARISON')
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
                            <button
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                              style={{ backgroundColor: C.navyLight, color: C.navy }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M12 15V3M7 10l5 5 5-5" stroke={C.navy} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke={C.navy} strokeWidth="2.2" strokeLinecap="round" />
                              </svg>
                              Report
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[i] && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={11} className="px-8 py-4 border-t border-b border-slate-200">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
      </div>

    </div>
  )
}
