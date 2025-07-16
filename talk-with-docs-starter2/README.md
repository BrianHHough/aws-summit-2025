# Talk with Docs

## Install Auth

```bash
npm install next-auth
```

## Set up `next-auth` Credentials

For `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

## Document Chat with Streaming Responses

This application includes a document chat feature that allows users to interact with their documents using a chat interface. The implementation uses server-sent events (SSE) to stream responses from the backend to the frontend, providing a real-time chat experience.

### Key Features

- Real-time streaming responses using Server-Sent Events (SSE)
- Integration with AWS AppSync and Lambda for document processing
- Chat history for each document
- Responsive UI for desktop and mobile devices

### Configuration

To configure the document chat feature, add the following environment variables:

```bash
APPSYNC_ENDPOINT=https://your-appsync-endpoint.appsync-api.region.amazonaws.com/graphql
APPSYNC_API_KEY=your-appsync-api-key
```

### Implementation Details

The document chat feature uses:

1. Next.js API routes with Edge Runtime for streaming responses
2. React hooks for managing chat state and streaming
3. AWS AppSync for GraphQL API integration
4. AWS Lambda with Bedrock for document processing and AI responses

## PDF Page Counter

Need to install the `pdf-lib` package with legacy dependencies to not conflict with `graphql` and `apollo-client`:

```bash
npm install pdf-lib --legacy-peer-deps
```