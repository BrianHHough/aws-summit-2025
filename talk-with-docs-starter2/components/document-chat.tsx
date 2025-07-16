"use client";

import { useState, useRef, useEffect } from "react";
import { useDocumentChat } from "@/hooks/useDocumentChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { ChatMessage } from "@/types";

interface DocumentChatProps {
  documentId: string;
  sessionId?: string;
}

export function DocumentChat({ documentId, sessionId }: DocumentChatProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { sendMessage, response, isLoading, error } = useDocumentChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, response]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Mock user ID (in a real app, get from auth context)
    const userId = "user-123";
    const currentDate = new Date();

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      documentId,
      userId,
      createdAt: currentDate,
      timestamp: currentDate.toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Clear input and start assistant response
    setPrompt("");

    // Create placeholder for assistant response
    const assistantMessageId = (Date.now() + 1).toString();
    const responseDate = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        documentId,
        userId,
        createdAt: responseDate,
        timestamp: responseDate.toISOString(),
      },
    ]);

    // Send message to API
    await sendMessage(prompt, documentId);
  };

  // Update assistant message with streaming response
  useEffect(() => {
    if (response && messages.length > 0) {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === "assistant") {
          return [...prev.slice(0, -1), { ...lastMessage, content: response }];
        }
        return prev;
      });
    }
  }, [response]); // Removed messages.length to prevent infinite loop

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages.length === 0 && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg">
            Error: {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about this document..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !prompt.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}