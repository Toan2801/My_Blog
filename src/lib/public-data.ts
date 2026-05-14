import { cache } from 'react';
import { getCachedSeries, getCachedSiteConfig, getCachedArticleBySlug } from './cache';
import { getAllArticles } from './data';
import { getVideos } from './video-data';

export const getPublicSiteConfig = cache(async () => getCachedSiteConfig());

export async function getPublicArticleSummaries() {
	return getAllArticles();
}

export const getPublicSeries = cache(async () => getCachedSeries());

export const getPublicArticleBySlug = cache(async (slug: string) => getCachedArticleBySlug(slug));

export const getPublicVideos = cache(async () => getVideos());