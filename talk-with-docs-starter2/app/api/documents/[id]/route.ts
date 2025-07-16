import { NextRequest } from "next/server";
import { gql } from "@apollo/client";
import { createAppSyncClient } from "@/lib/appsync-client";
import { auth } from "@/app/auth";

// Optional: types for TypeScript
interface GetDocumentResponse {
  getDocument: {
    document_id: string;
    user_id: string;
    file_title: string;
    file_type: string;
    s3_key: string;
    scan_status: string;
    upload_timestamp: string;
    processing_status?: string;
    page_count?: number;
    file_size?: number;
    final_s3_key?: string;
    last_accessed?: string;
    tags?: string[];
  };
}

// GraphQL query
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Extract id from params first
  const documentId = params.id;
  
  const session = await auth();
  console.log("Session:", session);
  const idToken = session?.id_token;

  if (!idToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const client = createAppSyncClient(idToken);

  try {
    const { data } = await client.query<GetDocumentResponse>({
      query: GET_DOCUMENT_QUERY,
      variables: { document_id: documentId },
      fetchPolicy: "no-cache", // optional, to avoid cached SSR data
    });

    return new Response(JSON.stringify(data.getDocument), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[AppSync Error]", err);
    const status = err.message?.includes("Unauthorized") ? 403 : 500;
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
