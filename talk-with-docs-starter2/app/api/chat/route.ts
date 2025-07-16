import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { prompt, documentId } = await req.json();

  // Set up SSE response headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // For development/testing, use the local streaming endpoint
        // In production, replace with your actual AppSync endpoint
        const useLocalEndpoint = !process.env.APPSYNC_ENDPOINT || process.env.NODE_ENV === 'development';
        
        if (useLocalEndpoint) {
          // Use the local streaming implementation for testing
          const response = await fetch(new URL('/api/chat/streaming', req.url), {
            method: 'POST',
            credentials: "include",
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.get('cookie') || '',
            },
            body: JSON.stringify({ prompt, documentId }),
          });
          
          if (response.body) {
            const reader = response.body.getReader();
            
            // Process the stream
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Forward the chunks directly to the client
              controller.enqueue(value);
            }
          }
        } else {
          // Call your AWS AppSync endpoint in production
          const response = await fetch(process.env.APPSYNC_ENDPOINT || '', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.APPSYNC_API_KEY || '',
            },
            body: JSON.stringify({
              query: `
                mutation InvokeModel($input: InvokeModelInput!) {
                  invokeModel(input: $input) {
                    body
                  }
                }
              `,
              variables: {
                input: {
                  prompt,
                  documentId,
                  streaming: true
                }
              }
            })
          });

          // Check if the response supports streaming
          if (response.body) {
            const reader = response.body.getReader();
            
            // Process the stream
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Parse the chunk and send it to the client
              const chunk = new TextDecoder().decode(value);
              try {
                const parsedChunk = JSON.parse(chunk);
                const textChunk = parsedChunk.data?.invokeModel?.body || '';
                
                // Send the chunk to the client
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: textChunk })}\n\n`));
              } catch (e) {
                // Handle parsing errors
                console.error('Error parsing chunk:', e);
              }
            }
          }
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