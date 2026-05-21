import { cache } from 'react';
import { getCachedSeries, getCachedSiteConfig, getCachedArticleBySlug } from './cache';
import { getAllArticles } from './data';

export const getPublicSiteConfig = cache(async () => getCachedSiteConfig());

export async function getPublicArticleSummaries() {
	return getAllArticles();
}

export const getPublicSeries = cache(async () => getCachedSeries());

export const getPublicArticleBySlug = cache(async (slug: string) => getCachedArticleBySlug(slug));
