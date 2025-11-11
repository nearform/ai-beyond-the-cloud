/**
 * Text chunking and URL content fetching utilities
 */

export const MAX_CHUNK_SIZE = 4_000; // Reduced to account for prompt overhead
const CHUNK_OVERLAP = 100;

/**
 * Splits text into chunks respecting sentence boundaries
 */
export function chunkText(text: string, maxChunkSize: number = MAX_CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;

    if (end < text.length) {
      const breakPoint = Math.max(
        text.lastIndexOf('.', end),
        text.lastIndexOf('\n', end)
      );
      if (breakPoint > start + maxChunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks;
}

/**
 * Fetches content from a URL and extracts text
 */
export async function fetchUrlContent(url: string): Promise<string> {
  const fetchUrl = url.startsWith('http://') || url.startsWith('https://') 
    ? url 
    : `https://${url}`;

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const MAX_HTML_SIZE = 500 * 1024;
  const htmlToProcess = html.length > MAX_HTML_SIZE 
    ? html.substring(0, MAX_HTML_SIZE) + '... [truncated]'
    : html;

  const textContent = htmlToProcess
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (textContent.length < 100) {
    throw new Error('Could not extract sufficient text content from URL');
  }

  return textContent;
}

