// app/(dashboard)/dashboard/documents/[id]/page.tsx
import { format } from "date-fns";
import Link from "next/link";
import { gql } from "@apollo/client";
import { auth } from "@/app/auth";
import { createAppSyncClient } from "@/lib/appsync-client";
import {
  FileText,
  ArrowLeft,
  Download,
  Share2,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentChatHistory } from "@/components/document-chat-history";

interface PageProps {
  params: { id: string };
}

// GraphQL query for AppSync
const GET_DOCUMENT_QUERY = gql`
  query GetDocument($document_id: ID!) {
    getDocument(document_id: $document_id) {
      document_id
      user_id
      file_title
      file_type
      s3_key
      scan_status
      upload_timestamp
      processing_status
      page_count
      file_size
      final_s3_key
      last_accessed
      tags
    }
  }
`;

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document_id_from_url = id;
  const session = await auth();
  const idToken = session?.id_token;
  const userId = session?.user?.id;

  if (!idToken || !userId) {
    return renderError(
      "Unauthorized",
      "You must be signed in to view this document."
    );
  }

  const client = createAppSyncClient(idToken);

  let document;
  try {
    const { data } = await client.query({
      query: GET_DOCUMENT_QUERY,
      variables: { document_id: document_id_from_url },
      fetchPolicy: "no-cache",
    });
    document = data?.getDocument;
    if (!document) {
      return renderError(
        "Document Not Found",
        "The document you're looking for doesn't exist."
      );
    }

    if (document.user_id !== userId) {
      return renderError(
        "Access Denied",
        "You don’t have permission to access this document."
      );
    }

    if (document.upload_timestamp?.includes(".")) {
      document.upload_timestamp = document.upload_timestamp.split(".")[0];
    }
    if (document.last_accessed?.includes(".")) {
      document.last_accessed = document.last_accessed.split(".")[0];
    }
  } catch (err: any) {
    console.error("[AppSync] Error loading document:", err);
    return renderError(
      "Unable to Load Document",
      "There was a problem loading this document."
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">
            {document.file_title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the document and all associated
                  chat history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-5 space-y-4">
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="chat-history">Chat History</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Preview</CardTitle>
                  <CardDescription>
                    A preview of the document content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-center mb-4 h-48 rounded bg-muted/50">
                      <FileText className="h-12 w-12 text-muted-foreground/70" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-2">
                      Content Preview:
                    </p>
                    <p className="whitespace-pre-line">
                      Full preview not available. Start a chat to interact with
                      the document.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/dashboard/documents/${id}/chat`}
                    className="w-full"
                  >
                    <Button className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat with this Document
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="chat-history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chat History</CardTitle>
                  <CardDescription>
                    Previous conversations with this document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentChatHistory documentId={id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <InfoRow
                  label="Uploaded"
                  value={format(
                    new Date(document.upload_timestamp.split(".")[0]),
                    "MMM d, yyyy"
                  )}
                />
                <InfoRow
                  label="Size"
                  value={`${document.file_size?.toFixed(2) || "?"} MB`}
                />
                <InfoRow
                  label="Pages"
                  value={`${document.page_count || "?"}`}
                />
                <InfoRow
                  label="Status"
                  value={document.processing_status || "n/a"}
                />
                <InfoRow
                  label="Last accessed"
                  value={
                    document.last_accessed
                      ? format(
                          new Date(document.last_accessed),
                          "MMM d, h:mm a"
                        )
                      : "n/a"
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(document.tags || []).map((tag: string) => (
                  <div
                    key={tag}
                    className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Error screen
function renderError(title: string, message: string) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pt-6">
      <div className="text-center space-y-4">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{message}</p>
        <Link href="/dashboard/documents">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
