import { ItemStatus } from './StatusBadge'
interface Props { status: ItemStatus; daysLeft: number; maxDays?: number }
export default function StatusBar({ status, daysLeft, maxDays = 30 }: Props) {
  const pct = status === 'expired' ? 0 : Math.min(100, (daysLeft / maxDays) * 100)
  const color = status === 'expired' ? '#dc2626' : status === 'almost' ? '#d97706' : '#4f6d35'
  return (
    <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
