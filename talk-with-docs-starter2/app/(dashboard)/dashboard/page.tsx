import Link from "next/link";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { BarChart, FileText, MessageSquare, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard-stats";
import { RecentDocuments } from "@/components/recent-documents";
import { RecentChats } from "@/components/recent-chats";

// Auth
import { auth } from "@/app/auth";
import { redirect } from 'next/navigation'

// Queries
import { createAppSyncClient } from "@/lib/appsync-client";
import { LIST_DOCUMENTS_BY_USER_BY_TIME } from "@/app/graphql/queries/listDocumentsByUserByTime";
import { LIST_DOCUMENT_SESSIONS_BY_USER_BY_TIME } from "@/app/graphql/queries/listDocumentSessionsByUserByTime";

// Types
import { Document } from "@/types";


export default async function DashboardPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session || !session.id_token) {
    redirect('/api/auth/signin')
  }

  const client = createAppSyncClient(session.id_token);

  let documents = [];
  let chats = [];

  try {
    const [
      documentsData, 
      // sessionsData
    ] = await Promise.all([
      client.query({
        query: LIST_DOCUMENTS_BY_USER_BY_TIME,
        fetchPolicy: "no-cache",
      }),
      // client.query({
      //   query: LIST_DOCUMENT_SESSIONS_BY_USER_BY_TIME,
      //   fetchPolicy: "no-cache",
      // }),
    ]);

    documents = documentsData?.data?.listDocumentsByUserByTime ?? [];
    // chats = sessionsData?.data?.listDocumentSessionsByUserByTime ?? [];
  } catch (err) {
    console.error("[AppSync] Dashboard query error:", err);
    return <div>Error loading dashboard data. Please sign in again or try later.</div>;
  }

  // const totalStorageMB: number = documents.reduce((acc: number, doc: Document) => acc + (doc.file_size || 0), 0) / (1024 * 1024);
  // console.log('totalStorageMB', totalStorageMB)
  // // Calculate active documents accessed in last 30 days
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const activeDocuments: number = documents.filter((doc: Document) => {
    const uploadedAt = new Date(doc.upload_timestamp).getTime();
    return (Date.now() - uploadedAt) <= THIRTY_DAYS_MS;
  }).length;
  console.log('activeDocuments', activeDocuments)

  // console.log('totalStorageMB', totalStorageMB)
  // console.log('activeDocuments', activeDocuments)

  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/upload">
            <Button>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents?.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+5 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.4 MB</div>
            <p className="text-xs text-muted-foreground">of 1 GB (2.8%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Accessed in the last 30 days
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Documents Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
              <DashboardStats />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent document interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Created new chat
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Financial Report Q3.pdf
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  {format(new Date(), "MMM d, h:mm a")}
                </div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Uploaded new document
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Meeting Notes.pdf
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  {format(
                    new Date(Date.now() - 24 * 60 * 60 * 1000),
                    "MMM d, h:mm a"
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Created new chat
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Product Specs.pdf
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  {format(
                    new Date(Date.now() - 48 * 60 * 60 * 1000),
                    "MMM d, h:mm a"
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Your recently uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentDocuments />
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/documents">
              <Button variant="outline" className="w-full">
                View All Documents
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Chats</CardTitle>
            <CardDescription>
              Your recent document conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentChats />
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/chats">
              <Button variant="outline" className="w-full">
                View All Chats
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
