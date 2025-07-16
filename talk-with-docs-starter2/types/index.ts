export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Document {
  document_id: string;
  file_title: string;
  filename: string;
  upload_timestamp: Date;
  user_id: string;
  file_size: number;
  page_count: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DocumentSession {
  id: string;
  title: string;
  documentId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}
// Document chat types

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  documentId: string;
  userId: string;
  createdAt: Date;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  documentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}