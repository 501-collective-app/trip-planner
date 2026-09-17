export function BrandMark({
  size = 'md',
  on = 'dark',
  badge = false,
}: {
  size?: 'sm' | 'md' | 'lg' | 'huge'
  on?: 'dark' | 'light'
  badge?: boolean
}) {
  const sizeClass = {
    sm: 'h-9 w-auto',
    md: 'w-44 h-auto',
    lg: 'w-64 h-auto',
    huge: 'max-h-[70vh] max-w-[85vw] w-auto h-auto',
  }[size]
  const src = on === 'dark' ? '/brand/logo-light-green.svg' : '/brand/logo-black.svg'
  const img = <img src={src} alt="501 Collective" className={`${sizeClass} relative z-10 select-none`} draggable={false} />

  if (!badge) return img

  const circleSize = { sm: 'h-14 w-14', md: 'h-[150px] w-[150px]', lg: 'h-72 w-72', huge: 'h-[70vh] w-[70vh]' }[size]
  const circleColor = on === 'dark' ? 'bg-white/10' : 'bg-white/40'

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={`absolute rounded-full ${circleSize} ${circleColor}`} />
      {img}
    </div>
  )
}
