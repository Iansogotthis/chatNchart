
import { useState } from 'react';
import { generateResponse } from '@/lib/perplexityService';

export function usePerplexity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getResponse = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await generateResponse(prompt);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getResponse, loading, error };
}
