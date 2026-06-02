'use client'

import { useEffect, useRef, useState } from 'react'
import { Zap, Users, Award, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Certifications délivrées', value: 500, suffix: '+', icon: Award },
  { label: 'Utilisateurs actifs', value: 2000, suffix: '+', icon: Users },
  { label: 'Taux de satisfaction', value: 94, suffix: '%', icon: TrendingUp },
  { label: 'Modules disponibles', value: 9, suffix: '', icon: Zap },
]

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1800
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current = Math.min(current + increment, target)
            setCount(Math.round(current))
            if (current >= target) clearInterval(timer)
          }, duration / steps)
        }
      },
      { threshold: 0.4 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  )
}

export function StatsCounter() {
  return (
    <section className="w-full py-16 md:py-20 bg-[#fbf8f3] border-y border-[#f0ebe3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center space-y-2"
              >
                <div className="w-12 h-12 bg-[#fff7ed] rounded-2xl flex items-center justify-center mb-1">
                  <Icon className="w-6 h-6 text-[#e97e42]" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#e97e42] to-[#d56a2e]">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
