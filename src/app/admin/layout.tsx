import AdminAssistant from '@/components/AdminAssistant';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container admin-layout-wrapper relative min-h-screen" style={{ paddingTop: 'var(--space-6)', marginTop: 0 }}>
      {children}
      <AdminAssistant />
    </div>
  );
}
