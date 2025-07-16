// app/auth.ts
import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import { jwtDecode as jwt } from "jwt-decode";

// For Debugging:
// console.log("[NextAuth] Cognito Client ID:", process.env.COGNITO_CLIENT_ID);
// console.log("[NextAuth] Cognito Issuer:", process.env.COGNITO_ISSUER);

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
  } = NextAuth(() => ({
  providers: [
    Cognito({
        id: "cognito", // to match the string used in `signIn("cognito")`
        clientId: process.env.COGNITO_CLIENT_ID!,
        clientSecret: undefined,
        // clientSecret: process.env.COGNITO_CLIENT_SECRET!, # Retired 06/14 at 11:08 p.m.
        issuer: process.env.COGNITO_ISSUER!,
        client: {
          token_endpoint_auth_method: "none", // ✅ 🚀 This is the key fix for no secret cognito
        },
        authorization: {
          params: {
            scope: "openid email profile",
            response_type: "code",
          },
        },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.id_token) {
        token.id_token = account.id_token;

        const decoded: any = jwt(account.id_token);
        token.sub = profile?.sub || account.providerAccountId || decoded?.sub;
        token.email = profile?.email || decoded?.email;
      }
      return token;
    },
    async session({ session, token }) {
        const customToken = token as {
          id_token?: string;
          sub?: string;
          email?: string;
        };
      
        session.id_token = customToken.id_token;
        session.user.id = customToken.sub ?? "unknown";
        session.user.sub = customToken.sub ?? "unknown";
        session.user.email = customToken.email ?? "no-email@example.com";
      
        return session;
      }
  },
}));