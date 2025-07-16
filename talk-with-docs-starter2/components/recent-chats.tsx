import Link from "next/link";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

// Mock data for recent chats
const recentChats = [
  {
    id: "1",
    title: "Financial Report Analysis",
    documentTitle: "Financial Report Q3.pdf",
    updatedAt: new Date(),
    messageCount: 12,
  },
  {
    id: "2",
    title: "Meeting Follow-up",
    documentTitle: "Meeting Notes.pdf",
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    messageCount: 8,
  },
  {
    id: "3",
    title: "Product Requirements",
    documentTitle: "Product Specs.pdf",
    updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    messageCount: 15,
  }
];

export function RecentChats() {
  return (
    <div className="space-y-4">
      {recentChats.map((chat) => (
        <Link 
          key={chat.id}
          href={`/dashboard/chats/${chat.id}`}
          className="flex items-center space-x-4 rounded-lg border p-4 transition-all hover:bg-accent"
        >
          <div className="rounded-lg bg-primary/10 p-2">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1 truncate">
            <p className="font-medium leading-none">{chat.title}</p>
            <p className="text-sm text-muted-foreground truncate">
              {chat.documentTitle}
            </p>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <div>{format(chat.updatedAt, "MMM d")}</div>
            <div>{chat.messageCount} messages</div>
          </div>
        </Link>
      ))}
    </div>
  );
}