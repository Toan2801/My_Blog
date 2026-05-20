import { getAllArticlesAdmin } from '@/lib/data';
import AdminHomeList from '@/components/AdminHomeList';

export default async function AdminDashboard() {
  const articles = await getAllArticlesAdmin();
  return (
    <div className="box-border flex w-full flex-1 flex-col gap-4 px-8 py-6 max-md:p-4">
      <AdminHomeList articles={articles} />
    </div>
  );
}
