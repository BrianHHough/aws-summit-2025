import Link from "next/link";
import { format } from "date-fns";
import { 
  FileText, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UploadCloud 
} from "lucide-react";
import { fetchDocumentsByUser } from "@/lib/fetchDocuments";
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
import { Document } from "@/types";
import { auth } from "@/app/auth";
import { createAppSyncClient } from "@/lib/appsync-client";
import { gql } from "@apollo/client";

const LIST_DOCUMENTS_QUERY = gql`
  query ListDocumentsByUserByTime {
    listDocumentsByUserByTime {
      document_id
      file_title
      upload_timestamp
      file_size
      page_count
      processing_status
    }
  }
`;


export default async function DocumentsPage() {
  const session = await auth();
  const idToken = session?.id_token;

  if (!idToken) {
    // Return a fallback or redirect
    return <div>You must be signed in to view documents.</div>;
  }

  const client = createAppSyncClient(idToken);
  console.log("[DocumentsPage] Session:", session);
console.log("[DocumentsPage] idToken:", session?.id_token);

  let documents = [];
  try {
    const { data } = await client.query({
      query: LIST_DOCUMENTS_QUERY,
      fetchPolicy: "no-cache",
    });

    documents = data?.listDocumentsByUserByTime ?? [];
  } catch (err) {
    console.error("[AppSync] Error fetching documents:", err);
    return <div>Error loading documents. Please try again later.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <Link href="/dashboard/upload">
          <Button>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            Manage and search through your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search documents..." className="pl-8" />
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
                  <TableHead>Document</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: Document) => (
                  <TableRow key={doc.document_id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/documents/${doc.document_id}`} className="flex items-center gap-2 hover:underline">
                        <FileText className="h-4 w-4 text-primary" />
                        {doc.file_title}
                      </Link>
                    </TableCell>
                    <TableCell>{format(doc.upload_timestamp, "MMM d, yyyy")}</TableCell>
                    <TableCell>{doc.page_count}</TableCell>
                    <TableCell>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="capitalize text-sm">Completed</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link href={`/dashboard/documents/${doc.document_id}`} className="w-full">
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href={`/dashboard/chat?documentId=${doc.document_id}`} className="w-full">
                              Chat with Document
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Download</DropdownMenuItem>
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