// app/api/appsync-test/route.ts
import { auth } from "@/app/auth";
import { createAppSyncClient } from "@/lib/appsync-client";
import { gql } from "@apollo/client";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const session = await auth();
  const idToken = session?.id_token;

  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createAppSyncClient(idToken);

  const TEST_DOCUMENT_ID = "32afawefwaef-0004-450f-918d-6da583ee8de8";

  const GET_DOCUMENT_QUERY = gql`
    query GetDocument($document_id: ID!) {
      getDocument(document_id: $document_id) {
        document_id
        user_id
        file_title
        scan_status
      }
    }
  `;

  try {
    const { data } = await client.query({
      query: GET_DOCUMENT_QUERY,
      variables: { document_id: "32afawefwaef-0004-450f-918d-6da583ee8de8" },
      fetchPolicy: "no-cache",
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[AppSync Test Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
