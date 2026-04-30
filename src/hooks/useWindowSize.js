import { useEffect, useState } from 'react'

export function useWindowSize() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w
}

export const useIsDesktop = () => useWindowSize() >= 1024
export const useIsTablet  = () => { const w = useWindowSize(); return w >= 768 && w < 1024 }
