"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FileText, 
  Send, 
  MoreHorizontal, 
  Settings, 
  CornerDownLeft,
  User,
  Bot,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/types";

// Mock document data
const documents = [
  {
    id: "1",
    title: "Financial Report Q3.pdf",
  },
  {
    id: "2",
    title: "Meeting Notes.pdf",
  },
  {
    id: "3",
    title: "Product Specs.pdf",
  },
];

// Initial mock messages
const initialMessages: ChatMessage[] = [
  {
    id: "1",
    content: "Hello! I'm your AI assistant. How can I help you with this document today?",
    role: "assistant",
    documentId: "1",
    userId: "user1",
    createdAt: new Date(),
  },
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId") || "1";
  const document = documents.find((doc) => doc.id === documentId) || documents[0];
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      documentId,
      userId: "user1",
      createdAt: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputValue),
        role: "assistant",
        documentId,
        userId: "user1",
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple mock AI response generator
  const getAIResponse = (query: string): string => {
    const responses = [
      "Based on the document, the financial results for Q3 show a 12% increase in revenue compared to Q2.",
      "The document indicates that operating expenses were reduced by 8% through various cost-cutting measures.",
      "According to the financial report, the company's cash reserves stand at $24.5 million, which is an increase of $3.2 million from the previous quarter.",
      "The document mentions that the board of directors has approved a dividend payment of $0.15 per share, payable on November 15.",
      "Looking at the data in the document, the company's profit margin improved from 18% to 22% in the third quarter.",
      "I found in the document that the company is planning to expand into new markets in the next fiscal year.",
      "The financial report highlights a significant reduction in debt, with the debt-to-equity ratio improving from 1.8 to 1.2.",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="font-semibold">
              Chat with: {document.title}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Chat Settings
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Clear chat history</DropdownMenuItem>
                <DropdownMenuItem>Download chat</DropdownMenuItem>
                <DropdownMenuItem>Share conversation</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex max-w-[80%] items-start gap-2 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <Textarea
              placeholder="Ask a question about your document..."
              className="min-h-[80px] resize-none pr-12"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <div className="absolute right-4 bottom-3 flex items-center text-xs text-muted-foreground">
              <CornerDownLeft className="mr-1 h-3 w-3" />
              Enter
            </div>
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isLoading}
            className="h-10 w-10 rounded-full p-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}