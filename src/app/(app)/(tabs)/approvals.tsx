import { Card, EmptyState, ErrorBanner, Loading, Screen, SectionTitle } from '@/components/ui';
import { ClaimRow, PendingRow } from '@/components/rows';
import type { ClaimListItem, PendingItem } from '@/lib/types';
import { useApi } from '@/lib/useApi';

interface Pending {
  count: number;
  items: PendingItem[];
  awaiting_payment: ClaimListItem[];
}

export default function Approvals() {
  const { data, error, loading, refreshing, reload } = useApi<Pending>('/approvals/pending/');
  if (loading && !data) return <Loading />;

  // Group by stage so each approver sees their queue(s) clearly.
  const groups = new Map<string, PendingItem[]>();
  for (const item of data?.items ?? []) {
    groups.set(item.stage, [...(groups.get(item.stage) ?? []), item]);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data && data.count === 0 && !data.awaiting_payment.length && (
        <Card><EmptyState icon="checkmark-done-circle-outline" title="You're all caught up" message="Nothing is waiting for your approval right now." /></Card>
      )}
      {[...groups.entries()].map(([stage, items]) => (
        <SectionGroup key={stage} title={`${stage} (${items.length})`}>
          {items.map((i) => <PendingRow key={`${i.kind}-${i.id}`} item={i} />)}
        </SectionGroup>
      ))}
      {!!data?.awaiting_payment.length && (
        <SectionGroup title={`Approved — record payment (${data.awaiting_payment.length})`}>
          {data.awaiting_payment.map((c) => <ClaimRow key={c.id} item={c} showEmployee />)}
        </SectionGroup>
      )}
    </Screen>
  );
}

function SectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <Card style={{ padding: 0, gap: 0 }}>{children}</Card>
    </>
  );
}
