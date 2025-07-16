import { NextRequest } from "next/server";
// import { jwtDecode } from "jwt-decode"; // You'll need to install this package
import { auth } from "@/app/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    // Use NextAuth edge-safe helper to get session
  const session = await auth();
  const userId = session?.user?.id || "anonymous";
  const idToken = session?.id_token || "";

  console.log("Authenticated User ID:", userId);
  console.log("ID Token:", idToken ? "[Present]" : "[Missing]");
  
  // Try to get the session token from cookies
  
   
  const sessionToken = req.cookies.get("next-auth.session-token")?.value;
  console.log("Session token:", sessionToken);
  // You might also check for a specific ID token cookie if you've set one
    const cognitoIdToken = req.cookies.get("cognito.id-token")?.value;
  

  const { prompt, documentId } = await req.json();
  const serverUrl = process.env.SERVER_URL!;
  const serverChatUrl = `${serverUrl}/chat`

  const secureBody = {
    message: prompt,
    documentId: documentId,
    userId: userId, // From verified session
  };

  // Set up SSE response headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Forward the request to the FastAPI server with auth header
        const response = await fetch(serverChatUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add the Authorization header with the token
            // Forward Cognito-issued ID Token to server (Signed with Cognito's Private Key)
            "Authorization": `Bearer ${idToken}`,
            "X-User-Id": userId
          },
          body: JSON.stringify(secureBody),
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        // Rest of your streaming code remains unchanged
        if (!response.body) {
          throw new Error("Response from server is not readable");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      } catch (error) {
        console.error("Error in streaming:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: error instanceof Error ? error.message : "An unknown error occurred",
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
