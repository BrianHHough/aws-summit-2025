'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
}

interface DocumentChatHistoryProps {
  documentId: string;
}

export function DocumentChatHistory({ documentId }: DocumentChatHistoryProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, fetch chat history from your API
    // This is a mock implementation
    const mockChatSessions = [
      {
        id: '1',
        title: 'Initial document review',
        timestamp: new Date().toISOString(),
        preview: 'What are the key findings in this report?'
      },
      {
        id: '2',
        title: 'Follow-up questions',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        preview: 'Can you explain the methodology used?'
      }
    ];
    
    setTimeout(() => {
      setChatSessions(mockChatSessions);
      setIsLoading(false);
    }, 500);
  }, [documentId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Chat History</h3>
        <Link href={`/dashboard/documents/${documentId}/chat`}>
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Loading chat history...</div>
      ) : chatSessions.length > 0 ? (
        <div className="space-y-2">
          {chatSessions.map((session) => (
            <Link key={session.id} href={`/dashboard/documents/${documentId}/chat?session=${session.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{session.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{session.preview}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(session.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No chat history found for this document.
        </div>
      )}
    </div>
  );
}