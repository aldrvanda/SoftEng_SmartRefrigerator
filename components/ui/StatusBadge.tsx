export type ItemStatus = 'safe' | 'almost' | 'expired'
interface Props { status: ItemStatus; daysLeft: number }
export default function StatusBadge({ status, daysLeft }: Props) {
  if (status === 'expired') return <span className="badge-expired">Expired</span>
  if (status === 'almost') return <span className="badge-almost">{daysLeft === 0 ? 'Today' : `${daysLeft}d left`}</span>
  return <span className="badge-safe">{daysLeft}d left</span>
}
