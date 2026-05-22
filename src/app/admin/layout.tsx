export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 mt-0 min-h-screen bg-muted pt-8">
      {children}
    </div>
  );
}
