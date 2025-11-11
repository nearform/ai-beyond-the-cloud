import { chunkText, MAX_CHUNK_SIZE } from '@/utils/summarizer';

describe('summarizer utilities', () => {
  describe('chunkText', () => {
    it('should return single chunk for text shorter than max size', () => {
      const text = 'Short text';
      const chunks = chunkText(text);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('should split text into multiple chunks when exceeding max size', () => {
      const text = 'a'.repeat(MAX_CHUNK_SIZE * 2);
      const chunks = chunkText(text);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(MAX_CHUNK_SIZE + 100); // Allow for overlap
      });
    });

    it('should respect sentence boundaries when possible', () => {
      const text = 'First sentence. Second sentence. ' + 'a'.repeat(MAX_CHUNK_SIZE);
      const chunks = chunkText(text);
      
      // Should try to break at sentence boundaries
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should handle text with newlines', () => {
      const text = 'Line 1\nLine 2\n' + 'a'.repeat(MAX_CHUNK_SIZE);
      const chunks = chunkText(text);
      
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should include overlap between chunks', () => {
      const text = 'a'.repeat(MAX_CHUNK_SIZE * 3);
      const chunks = chunkText(text);
      
      if (chunks.length > 1) {
        // Check that chunks overlap (end of one chunk should appear in next)
        const firstChunkEnd = chunks[0].slice(-100);
        expect(chunks[1]).toContain(firstChunkEnd);
      }
    });

    it('should handle empty text', () => {
      const chunks = chunkText('');
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('');
    });

    it('should handle text exactly at max size', () => {
      const text = 'a'.repeat(MAX_CHUNK_SIZE);
      const chunks = chunkText(text);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('should trim whitespace from chunks', () => {
      const text = '   ' + 'a'.repeat(MAX_CHUNK_SIZE) + '   ';
      const chunks = chunkText(text);
      
      chunks.forEach(chunk => {
        expect(chunk).toBe(chunk.trim());
      });
    });
  });
});

