export type ItemStatus = 'safe' | 'almost' | 'expired'

interface Props { status: ItemStatus; daysLeft: number }

export default function StatusBadge({ status, daysLeft }: Props) {
  if (status === 'expired') {
    return <span className="badge-expired">Expired</span>
  }
  if (status === 'almost') {
    if (daysLeft === 0) return <span className="badge-almost">Expires Today</span>
    if (daysLeft === 1) return <span className="badge-almost">Tomorrow</span>
    return <span className="badge-almost">{daysLeft}d left</span>
  }
  // safe
  return <span className="badge-safe">{daysLeft}d left</span>
}
