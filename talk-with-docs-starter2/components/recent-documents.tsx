import Link from "next/link";
import { format } from "date-fns";
import { FileText } from "lucide-react";

// Mock data for recent documents
const recentDocuments = [
  {
    id: "1",
    title: "Financial Report Q3.pdf",
    uploadedAt: new Date(),
    pageCount: 24,
    fileSize: 3.8,
  },
  {
    id: "2",
    title: "Meeting Notes.pdf",
    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    pageCount: 5,
    fileSize: 0.7,
  },
  {
    id: "3",
    title: "Product Specs.pdf",
    uploadedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    pageCount: 18,
    fileSize: 2.1,
  }
];

export function RecentDocuments() {
  return (
    <div className="space-y-4">
      {recentDocuments.map((doc) => (
        <Link 
          key={doc.id}
          href={`/dashboard/documents/${doc.id}`}
          className="flex items-center space-x-4 rounded-lg border p-4 transition-all hover:bg-accent"
        >
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1 truncate">
            <p className="font-medium leading-none">{doc.title}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{doc.pageCount} pages</span>
              <span>•</span>
              <span>{doc.fileSize} MB</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(doc.uploadedAt, "MMM d")}
          </div>
        </Link>
      ))}
    </div>
  );
}