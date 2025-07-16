'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DocumentChat } from '@/components/document-chat';
import { Button } from '@/components/ui/button';

export default function DocumentChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.id as string;
  const sessionId = searchParams.get('session') || undefined;
  const [documentTitle, setDocumentTitle] = useState('Document');
  
  // In a real implementation, fetch document title from your API
  useEffect(() => {
    // Mock implementation - replace with actual API call
    const mockTitle = "Financial Report Q3.pdf";
    setDocumentTitle(mockTitle);
  }, [documentId]);
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/documents/${documentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{documentTitle}</h1>
        </div>
        {sessionId && (
          <Link href={`/dashboard/documents/${documentId}/chat`}>
            <Button variant="outline" size="sm">New Chat</Button>
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <DocumentChat documentId={documentId} sessionId={sessionId} />
      </div>
    </div>
  );
}