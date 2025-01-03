import { useState } from 'react';
import { useGemini } from '@/hooks/use-perplexity';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2 } from 'lucide-react';

export function PerplexityChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const { getResponse, loading, error } = useGemini();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    const result = await getResponse(prompt);
    if (result) {
      setResponse(result);
    }
    setPrompt('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Gemini AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me anything..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Send'}
            </Button>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          {response && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}