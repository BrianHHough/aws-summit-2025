import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Document Chat</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading document chat...</p>
        </div>
      </div>
    </div>
  );
}