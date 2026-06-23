'use client'

import { motion } from 'framer-motion'

interface ConfidenceGaugeProps {
  value: number
}

export function ConfidenceGauge({ value }: ConfidenceGaugeProps) {
  const radius = 70
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const percentage = Math.min(Math.max(value, 0), 100)
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 75) return 'var(--fresh)'
    if (val >= 40) return 'var(--warn)'
    return '#ef4444'
  }

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        {/* Background track */}
        <svg
          height={radius * 2}
          width={radius * 2}
          className="rotate-[-90deg]"
        >
          <circle
            stroke="oklch(0.22 0.01 240)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            stroke={getColor(percentage)}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{
              filter: `drop-shadow(0 0 8px ${getColor(percentage)})`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(percentage)}
            <span className="text-base text-muted-foreground">%</span>
          </motion.span>
        </div>
      </div>
    </div>
  )
}
