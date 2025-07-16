import { NextRequest } from 'next/server';

// Auth
import { auth } from "@/app/auth";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { prompt, documentId } = await req.json();
  const session = await auth();
  // console.log('req', req)

  // Set up SSE response headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // This is a simplified example that simulates streaming responses
        // In a real implementation, you would call your AWS AppSync endpoint
        
        // Simulate initial delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Send chunks of text to simulate streaming
        const response = `I've analyzed the document you provided. ${prompt} 
        
Based on the content, here are the key points:

1. The document discusses important financial metrics for Q3
2. There was a 12% increase in revenue compared to the previous quarter
3. Operating expenses were reduced by 8% through various cost-cutting measures
4. Cash reserves increased to $24.5 million, which is $3.2 million more than before`;

        const chunks = response.split(' ');
        
        // Send each word as a separate chunk with slight delays
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk + ' ' })}\n\n`));
          // Add a small random delay between chunks to simulate streaming
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
        }
      } catch (error) {
        console.error('Error in streaming:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}