import { useState, useCallback, useRef } from 'react';

export function useDocumentChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const accumulatedText = useRef('');

  const sendMessage = useCallback(async (prompt: string, documentId: string) => {
    setIsLoading(true);
    setResponse('');
    setError(null);
    accumulatedText.current = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, documentId }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      // Process the stream
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                // Accumulate the text and update the response
                accumulatedText.current += data.text;
                setResponse(accumulatedText.current);
              }
              if (data.error) {
                setError(data.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    response,
    isLoading,
    error,
  };
}
