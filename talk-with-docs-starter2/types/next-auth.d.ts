import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      sub: string
    } & DefaultSession["user"]
    id_token?: string
  }

  interface User {
    id: string
    sub: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    sub: string
    id_token?: string
  }
}