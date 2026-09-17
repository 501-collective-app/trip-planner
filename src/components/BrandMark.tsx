export function BrandMark({ size = 'md', on = 'dark' }: { size?: 'sm' | 'md'; on?: 'dark' | 'light' }) {
  const height = size === 'sm' ? 'h-8' : 'h-14'
  const src = on === 'dark' ? '/brand/logo-light-green.svg' : '/brand/logo-black.svg'
  return <img src={src} alt="501 Collective" className={`${height} w-auto select-none`} draggable={false} />
}
