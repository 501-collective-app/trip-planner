export function BrandMark({
  size = 'md',
  on = 'dark',
}: {
  size?: 'sm' | 'md' | 'lg' | 'huge'
  on?: 'dark' | 'light'
}) {
  const sizeClass = {
    sm: 'h-9 w-auto',
    md: 'w-44 h-auto',
    lg: 'w-64 h-auto',
    huge: 'max-h-[70vh] max-w-[85vw] w-auto h-auto',
  }[size]
  const src = on === 'dark' ? '/brand/logo-light-green.svg' : '/brand/logo-black.svg'
  return <img src={src} alt="501 Collective" className={`${sizeClass} select-none`} draggable={false} />
}
