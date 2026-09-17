export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const num = size === 'sm' ? 'text-2xl' : 'text-4xl'
  const sub = size === 'sm' ? 'text-[9px]' : 'text-xs'
  return (
    <div className="leading-none select-none">
      <div className={`${num} text-brand-mint`} style={{ fontFamily: 'var(--font-display)' }}>
        501
      </div>
      <div className={`${sub} mt-0.5 font-bold tracking-[0.2em] text-white`}>COLLECTIVE</div>
    </div>
  )
}
