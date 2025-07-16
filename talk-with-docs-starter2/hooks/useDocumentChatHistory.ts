import { useState, useEffect } from 'react';
import { ChatSession, ChatMessage } from '@/types';

export function useDocumentChatHistory(documentId: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChatHistory() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, fetch from your API
        // This is a mock implementation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock user ID
        const userId = 'user-123';
        const currentDate = new Date();
        const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const mockSessions: ChatSession[] = [
          {
            id: '1',
            documentId,
            title: 'Initial document review',
            messages: [
              {
                id: '1',
                role: 'user',
                content: 'What are the key findings in this report?',
                documentId,
                userId,
                createdAt: currentDate,
                timestamp: currentDate.toISOString()
              },
              {
                id: '2',
                role: 'assistant',
                content: 'The key findings in this report include a 12% increase in revenue, 8% reduction in operating expenses, and an increase in cash reserves to $24.5 million.',
                documentId,
                userId,
                createdAt: currentDate,
                timestamp: currentDate.toISOString()
              }
            ],
            createdAt: currentDate.toISOString(),
            updatedAt: currentDate.toISOString()
          },
          {
            id: '2',
            documentId,
            title: 'Follow-up questions',
            messages: [
              {
                id: '1',
                role: 'user',
                content: 'Can you explain the methodology used?',
                documentId,
                userId,
                createdAt: yesterdayDate,
                timestamp: yesterdayDate.toISOString()
              },
              {
                id: '2',
                role: 'assistant',
                content: 'The methodology used in this report involves standard financial analysis techniques including comparative analysis of quarterly data, trend analysis, and variance analysis.',
                documentId,
                userId,
                createdAt: yesterdayDate,
                timestamp: yesterdayDate.toISOString()
              }
            ],
            createdAt: yesterdayDate.toISOString(),
            updatedAt: yesterdayDate.toISOString()
          }
        ];
        
        setSessions(mockSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chat history');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchChatHistory();
  }, [documentId]);

  return {
    sessions,
    isLoading,
    error
  };
}