import { Card } from '@/components/ui/card'

interface GradientCardProps {
  title: string
  icon: React.ReactNode
  iconGradient: string
  headerGradient: string
  badge?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerSpacing?: 'mb-4' | 'mb-6'
}

export function GradientCard({
  title,
  icon,
  iconGradient,
  headerGradient,
  badge,
  action,
  children,
  className,
  headerSpacing = 'mb-6',
}: GradientCardProps) {
  return (
    <Card className={`border-0 shadow-xl overflow-hidden ${className ?? ''}`}>
      <div className={`bg-gradient-to-br ${headerGradient} p-6`}>
        <div className={`flex items-center gap-3 ${headerSpacing}`}>
          <div className={`p-2 bg-gradient-to-br ${iconGradient} rounded-lg shadow-lg`}>
            {icon}
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
          {badge && <div className="ml-auto">{badge}</div>}
          {action && <div className={badge ? '' : 'ml-auto'}>{action}</div>}
        </div>
        {children}
      </div>
    </Card>
  )
}
