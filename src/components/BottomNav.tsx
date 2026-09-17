import { NAV, type Tab } from './Sidebar'

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-stone-200 bg-white md:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      {NAV.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTab(id)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
            tab === id ? 'text-brand-mint-dark' : 'text-stone-400'
          }`}
        >
          <Icon size={20} strokeWidth={tab === id ? 2.5 : 2} />
          {label}
        </button>
      ))}
    </nav>
  )
}
