import { NextRequest } from "next/server";
import { auth } from "@/app/auth";

export async function POST(req: NextRequest) {
  // Get authenticated session
  const session = await auth();
  const userId = session?.user?.id || "anonymous";
  const idToken = session?.id_token || "";

  // Get request body
  const { file_title, file_type, file_size, page_count } = await req.json();
  
  // Get server URL from environment variable
  const serverUrl = process.env.SERVER_URL!;
  const uploadUrlEndpoint = `${serverUrl}/generate-upload-url`;
  console.log("Server URL:", serverUrl);

  try {
    // Forward the request to FastAPI with auth headers
    const response = await fetch(uploadUrlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
        "X-User-Id": userId
      },
      body: JSON.stringify({ file_title, file_type, file_size, page_count }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    // Return the response from FastAPI
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}