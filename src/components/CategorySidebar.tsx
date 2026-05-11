import Link from 'next/link';

interface Props {
  categories: string[];
  activeCategory?: string;
}

export default function CategorySidebar({ categories, activeCategory }: Props) {
  return (
    <aside className="category-sidebar">
      <div className="category-sidebar-title">Chủ đề</div>
      <ul className="category-sidebar-list">
        <li className="category-sidebar-item">
          <Link href="/articles" className={!activeCategory ? 'active' : ''}>
            Tất cả
          </Link>
        </li>
        {categories.map(cat => (
          <li key={cat} className="category-sidebar-item">
            <Link
              href={`/articles?category=${encodeURIComponent(cat)}`}
              className={activeCategory === cat ? 'active' : ''}
            >
              {cat}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
