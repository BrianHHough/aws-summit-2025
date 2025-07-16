// app/api/document/check-upload-status/route.ts
import { NextRequest } from "next/server";
import { auth } from "@/app/auth";

export async function POST(req: NextRequest) {
  // Use NextAuth edge-safe helper to get session
  const session = await auth();
  console.log('session', session)
  const userId = session?.user?.id || "anonymous";
  const idToken = session?.id_token || "";

  console.log("Authenticated User ID:", userId);
  console.log("ID Token:", idToken ? "[Present]" : "[Missing]");
  
  // Try to get the session token from cookies
  const sessionToken = req.cookies.get("next-auth.session-token")?.value;
  console.log("Session token:", sessionToken ? "[Present]" : "[Missing]");

  const { document_id } = await req.json();
  const serverUrl = process.env.SERVER_URL!;
  const statusEndpoint = `${serverUrl}/check-upload-status/${document_id}`;
  console.log("serverUrl", serverUrl);

  try {
    const response = await fetch(statusEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "X-User-Id": userId,
      },
    });

    if (response.status === 403) {
      console.log("Authorization failed: User doesn't have permission to access this document");
      return Response.json({ status: "UNAUTHORIZED", error: "You don't have permission to access this document" }, { status: 403 });
    }
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error checking upload status:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
