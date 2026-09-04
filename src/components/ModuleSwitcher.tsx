export type Module = 'label' | 'ifu'

type Props = {
  value: Module
  onChange: (m: Module) => void
}

// Segmented Label/IFU toggle — meant to sit in a NavBar's rightNode, next to the profile avatar.
export default function ModuleSwitcher({ value, onChange }: Props) {
  return (
    <div
      className="flex items-center rounded-full p-0.5 gap-0.5"
      style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
    >
      {(['label', 'ifu'] as const).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer"
          style={{
            backgroundColor: value === m ? '#FFFFFF' : 'transparent',
            color: value === m ? '#1C2E59' : 'rgba(255,255,255,0.75)',
          }}
        >
          {m === 'label' ? 'Label' : 'IFU'}
        </button>
      ))}
    </div>
  )
}
