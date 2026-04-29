import AdminAssistant from '@/components/AdminAssistant';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout-wrapper relative min-h-screen">
      {children}
      <AdminAssistant />
    </div>
  );
}
