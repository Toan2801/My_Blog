'use client';

import { useSearchParams } from 'next/navigation';
import type { ComponentProps } from 'react';
import ArticleListClient from './ArticleListClient';

export default function ArticleListFromUrl(props: Omit<ComponentProps<typeof ArticleListClient>, 'initialSearch' | 'initialCategory'>) {
  const params = useSearchParams();
  return <ArticleListClient {...props}
    initialSearch={params.get('search') ?? undefined}
    initialCategory={params.get('category') ?? undefined} />;
}
