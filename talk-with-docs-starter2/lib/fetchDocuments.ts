import { createAppSyncClient } from "@/lib/appsync-client";
import { LIST_DOCUMENTS_BY_USER_BY_TIME } from "@/app/graphql/queries/listDocumentsByUserByTime";
import { auth } from "@/app/auth";

export async function fetchDocumentsByUser() {
  const session = await auth();
  const idToken = session?.id_token;

  if (!idToken) throw new Error("Unauthorized");

  const client = createAppSyncClient(idToken);
  const { data } = await client.query({
    query: LIST_DOCUMENTS_BY_USER_BY_TIME,
    fetchPolicy: "no-cache",
  });

  return data?.listDocumentsByUserByTime ?? [];
}
