'use client'

import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'
import type { Globe } from 'cobe'

interface Globe3DProps {
  className?: string
}

export function Globe3D({ className }: Globe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<Globe | null>(null)
  const rafRef = useRef<number>(0)
  const phiRef = useRef(0.5)
  const pausedRef = useRef(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return

    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    const size = canvas.offsetWidth

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: 0.5,
      theta: 0.25,
      dark: 0,
      diffuse: 1.1,
      mapSamples: 12000,
      mapBrightness: 7,
      baseColor: [1, 1, 1],
      markerColor: [0.914, 0.494, 0.259],
      glowColor: [1, 0.94, 0.87],
      markers: [
        { location: [0.4162, 9.4673], size: 0.09 },
        { location: [39.9042, 116.4074], size: 0.08 },
        { location: [31.2304, 121.4737], size: 0.06 },
        { location: [23.1291, 113.2644], size: 0.05 },
        { location: [-4.3217, 15.3222], size: 0.05 },
        { location: [3.848, 11.5021], size: 0.05 },
      ],
    })

    globeRef.current = globe

    const animate = () => {
      if (!pausedRef.current) {
        phiRef.current += 0.004
        globe.update({ phi: phiRef.current })
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    const observer = new IntersectionObserver(
      ([entry]) => { pausedRef.current = !entry.isIntersecting },
      { threshold: 0.05 }
    )
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(rafRef.current)
      globe.destroy()
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
      aria-hidden="true"
    />
  )
}
