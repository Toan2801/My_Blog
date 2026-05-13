/**
 * paginate.ts — Splits article HTML into page-sized chunks.
 *
 * Splitting rules:
 * - Target ~800 words per page at default zoom.
 * - Never orphan a heading at the end of a page.
 * - Splitting is done at block-level element boundaries (p, h1-h6, ul, ol, blockquote, div, table, figure, hr).
 */

const BLOCK_TAG_RE = /^<\s*(p|h[1-6]|ul|ol|li|blockquote|div|table|figure|hr|section|pre|dl|dd|dt|figcaption|thead|tbody|tr|details|summary)\b/i;
const CLOSE_TAG_RE = /^<\s*\/\s*(p|h[1-6]|ul|ol|li|blockquote|div|table|figure|hr|section|pre|dl|dd|dt|figcaption|thead|tbody|tr|details|summary)\s*>/i;
const HEADING_RE = /^<\s*h[1-6]\b/i;

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Split HTML into top-level block elements.
 * This is a simple tag-level splitter, not a full parser.
 */
function splitIntoBlocks(html: string): string[] {
  const blocks: string[] = [];
  let current = '';
  let depth = 0;
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      // find end of tag
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) {
        current += html.slice(i);
        break;
      }
      const tag = html.slice(i, tagEnd + 1);

      // Self-closing tags like <hr/>, <br/>, <img ... />
      const isSelfClosing = tag.endsWith('/>') || /^<\s*(hr|br|img|input|meta|link)\b/i.test(tag);

      if (BLOCK_TAG_RE.test(tag) && !isSelfClosing) {
        if (depth === 0 && current.trim()) {
          blocks.push(current.trim());
          current = '';
        }
        current += tag;
        depth++;
      } else if (CLOSE_TAG_RE.test(tag)) {
        current += tag;
        depth--;
        if (depth <= 0) {
          depth = 0;
          if (current.trim()) {
            blocks.push(current.trim());
            current = '';
          }
        }
      } else if (isSelfClosing && BLOCK_TAG_RE.test(tag)) {
        if (depth === 0) {
          if (current.trim()) blocks.push(current.trim());
          blocks.push(tag);
          current = '';
        } else {
          current += tag;
        }
      } else {
        current += tag;
      }
      i = tagEnd + 1;
    } else {
      current += html[i];
      i++;
    }
  }

  if (current.trim()) {
    blocks.push(current.trim());
  }

  return blocks;
}

export interface PaginationResult {
  pages: string[];
  totalPages: number;
}

/**
 * Paginate article HTML into chunks of approximately `wordsPerPage` words.
 */
export function paginateHTML(html: string, wordsPerPage = 800): PaginationResult {
  const blocks = splitIntoBlocks(html);

  if (blocks.length === 0) {
    return { pages: [html || ''], totalPages: 1 };
  }

  const pages: string[] = [];
  let currentPage = '';
  let currentWordCount = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockWords = countWords(block);

    // If adding this block exceeds limit AND we already have content, start new page
    if (currentWordCount > 0 && currentWordCount + blockWords > wordsPerPage) {
      // But don't leave a heading orphaned at the end — include it in the next page
      // Check if currentPage ends with a heading
      const isCurrentHeading = HEADING_RE.test(block);

      if (!isCurrentHeading) {
        pages.push(currentPage);
        currentPage = block;
        currentWordCount = blockWords;
      } else {
        // This block is a heading — push current page and start new with heading
        pages.push(currentPage);
        currentPage = block;
        currentWordCount = blockWords;
      }
    } else {
      currentPage += (currentPage ? '\n' : '') + block;
      currentWordCount += blockWords;
    }
  }

  if (currentPage.trim()) {
    pages.push(currentPage);
  }

  // Edge case: if zero pages, return at least one
  if (pages.length === 0) {
    pages.push(html || '');
  }

  return { pages, totalPages: pages.length };
}
