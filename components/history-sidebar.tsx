'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle2, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

const mockHistory = [
  {
    id: 1,
    item: 'Organic Apples',
    status: 'Fresh',
    daysLeft: 7,
    confidence: 94,
    timeAgo: '2 min ago',
    emoji: '🍎',
  },
  {
    id: 2,
    item: 'Chicken Breast',
    status: 'Use Soon',
    daysLeft: 1,
    confidence: 87,
    timeAgo: '15 min ago',
    emoji: '🍗',
  },
  {
    id: 3,
    item: 'Strawberries',
    status: 'Fresh',
    daysLeft: 4,
    confidence: 91,
    timeAgo: '1 hr ago',
    emoji: '🍓',
  },
  {
    id: 4,
    item: 'Greek Yogurt',
    status: 'Expired',
    daysLeft: 0,
    confidence: 98,
    timeAgo: '2 hrs ago',
    emoji: '🥛',
  },
  {
    id: 5,
    item: 'Broccoli',
    status: 'Fresh',
    daysLeft: 5,
    confidence: 89,
    timeAgo: '5 hrs ago',
    emoji: '🥦',
  },
  {
    id: 6,
    item: 'Cheddar Cheese',
    status: 'Use Soon',
    daysLeft: 2,
    confidence: 82,
    timeAgo: '1 day ago',
    emoji: '🧀',
  },
  {
    id: 7,
    item: 'Spinach Leaves',
    status: 'Fresh',
    daysLeft: 3,
    confidence: 90,
    timeAgo: '2 days ago',
    emoji: '🥬',
  },
]

const statusConfig = {
  Fresh: {
    Icon: CheckCircle2,
    color: 'text-fresh',
    bg: 'bg-fresh/10',
    border: 'border-fresh/20',
  },
  'Use Soon': {
    Icon: AlertTriangle,
    color: 'text-warn',
    bg: 'bg-warn/10',
    border: 'border-warn/20',
  },
  Expired: {
    Icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
  },
}

export function HistorySidebar() {
  const freshCount = mockHistory.filter((h) => h.status === 'Fresh').length
  const warnCount = mockHistory.filter((h) => h.status === 'Use Soon').length

  return (
    <motion.aside
      className="lg:w-80 flex-shrink-0"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-card/40 backdrop-blur-xl border-2 border-border h-full">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Scan History</h2>
            </div>
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded-full">
              {mockHistory.length} scans
            </span>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-fresh/10 border border-fresh/20 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-fresh">{freshCount}</p>
              <p className="text-xs text-muted-foreground">Fresh</p>
            </div>
            <div className="bg-warn/10 border border-warn/20 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-warn">{warnCount}</p>
              <p className="text-xs text-muted-foreground">Use Soon</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh] divide-y divide-border">
          {mockHistory.map((item, index) => {
            const config =
              statusConfig[item.status as keyof typeof statusConfig] ||
              statusConfig['Fresh']
            const { Icon, color, bg, border } = config

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl leading-none mt-0.5">{item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm text-foreground truncate">
                        {item.item}
                      </p>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${bg} ${color} border ${border} whitespace-nowrap`}>
                        <Icon className="w-3 h-3" />
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.daysLeft > 0
                          ? `${item.daysLeft}d left`
                          : 'Expired'}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {item.confidence}%
                      </span>
                      <span className="ml-auto">{item.timeAgo}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Last 7 scans shown &middot; All times local
          </p>
        </div>
      </Card>
    </motion.aside>
  )
}
