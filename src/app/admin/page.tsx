import { getAllArticlesAdmin } from '@/lib/data';
import AdminHomeList from '@/components/AdminHomeList';

export default async function AdminDashboard() {
  const articles = await getAllArticlesAdmin();
  return (
    <div className="dc-admin-shell">
      <AdminHomeList articles={articles} />
    </div>
  );
}
