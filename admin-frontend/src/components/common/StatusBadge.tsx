import { STATUS_LABELS } from '../../types';

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
