import Link from "next/link";
import { format } from "date-fns";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  FileText,
  MoreHorizontal,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data for chat history
const chatSessions = [
  {
    id: "1",
    title: "Financial Analysis",
    documentTitle: "Financial Report Q3.pdf",
    documentId: "1",
    lastMessage: "What were the key financial metrics in Q3?",
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 12,
  },
  {
    id: "2",
    title: "Meeting Follow-up",
    documentTitle: "Meeting Notes.pdf",
    documentId: "2",
    lastMessage: "What action items were assigned to the marketing team?",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    messageCount: 8,
  },
  {
    id: "3",
    title: "Product Requirements",
    documentTitle: "Product Specs.pdf",
    documentId: "3",
    lastMessage: "What are the key features planned for the next release?",
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    messageCount: 15,
  },
  {
    id: "4",
    title: "Research Analysis",
    documentTitle: "Research Paper.pdf",
    documentId: "4",
    lastMessage: "Can you summarize the methodology used in this research?",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    messageCount: 20,
  },
  {
    id: "5",
    title: "Project Timeline Review",
    documentTitle: "Project Timeline.pdf",
    documentId: "5",
    lastMessage: "What are the critical milestones in Q4?",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    messageCount: 6,
  },
];

export default function ChatsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Chat History</h2>
        <Link href="/dashboard/documents">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Conversations</CardTitle>
          <CardDescription>
            Browse and manage your document conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search chats..." className="pl-8" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conversation</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chatSessions.map((chat) => (
                  <TableRow key={chat.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/chats/${chat.id}`} className="flex items-center gap-2 hover:underline">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        {chat.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/documents/${chat.documentId}`} className="flex items-center gap-2 hover:text-primary">
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[180px]">{chat.documentTitle}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{format(chat.updatedAt, "MMM d, yyyy")}</TableCell>
                    <TableCell>{chat.messageCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link href={`/dashboard/chats/${chat.id}`} className="w-full">
                              Continue Chat
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Download Transcript</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}