import NavBar from '../components/NavBar'
import { Tag, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react'
import { C } from '../colors'
import type { Screen } from '../App'

type Props = { onNavigate: (s: Screen) => void }

export default function ProofreaderDashboardScreen({ onNavigate }: Props) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: C.bg }}>
      <NavBar subtitle="Document proofreading tool" showProfile onProfileClick={() => onNavigate('profile')} onLogout={() => onNavigate('login')} profileName="Athmika" profileInitials="A" />

      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-6 py-10 flex flex-col items-center w-full mx-auto" style={{ maxWidth: 1100 }}>
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border"
              style={{ color: C.text, borderColor: C.border, backgroundColor: C.white }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#f2801d' }} />
              Deterministic · No ML · Audit-ready
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
            What would you like to compare?
          </h1>
          <p className="text-sm" style={{ color: C.muted, maxWidth: 480, margin: '0 auto' }}>
            Choose a document type to start a proofreading comparison.
          </p>
        </div>

        {/* Document type cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Card 1 — Labels */}
          <div className="p-6 flex flex-col border border-gray-200 border-t-4 border-t-[#ea580c] bg-white">
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 44, height: 44, backgroundColor: '#fff3eb' }}
              >
                <Tag size={22} className="text-[#ea580c]" />
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border border-[#ea580c]/20"
                style={{ backgroundColor: '#fff3eb', color: '#ea580c' }}
              >
                DEVICE LABELS
              </span>
            </div>
            <h2 className="font-bold text-base mb-2 text-gray-900">Labels</h2>
            <p className="text-sm mb-4 text-gray-500 leading-relaxed">
              Compare medical device labels and flag differences — run a quick comparison or validate against a Change Request Form.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {['Single or bulk label pairs', 'Text, graphics & barcode diff', 'Optional Change Request Form validation'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={16} className="text-[#ea580c] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('label-workflow')}
              className="mt-auto w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer hover:opacity-95"
              style={{ backgroundColor: '#f2801d' }}
            >
              Compare Labels <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 2 — IFU */}
          <div className="p-6 flex flex-col border border-gray-200 border-t-4 border-t-[#475569] bg-white">
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 44, height: 44, backgroundColor: '#F1F5F9' }}
              >
                <BookOpen size={22} className="text-[#475569]" />
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border border-[#475569]/20"
                style={{ backgroundColor: '#F1F5F9', color: '#475569' }}
              >
                INSTRUCTIONS FOR USE
              </span>
            </div>
            <h2 className="font-bold text-base mb-2 text-gray-900">IFU</h2>
            <p className="text-sm mb-4 text-gray-500 leading-relaxed">
              Compare Instructions for Use documents end to end — text, figures, tables, and matrix codes — across multi-page, multi-language IFUs.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {['OCR-backed text & layout diff', 'Figure, table & matrix-code diff', 'Language-set & directory checks'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={16} className="text-[#475569] shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onNavigate('upload-ifu')}
              className="mt-auto w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer hover:opacity-95"
              style={{ backgroundColor: '#475569' }}
            >
              Compare IFUs <ArrowRight size={14} />
            </button>
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
