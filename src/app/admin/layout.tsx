import AdminAssistant from '@/components/AdminAssistant';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 mt-0 min-h-screen bg-surface pt-8">
      {children}
      <AdminAssistant />
    </div>
  );
}
