// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    myJwt?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    myJwt?: string
  }
}

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string
    }
    email?: string | null
    verified?: boolean
  }

  interface JWT {
    email?: string | null
    verified?: boolean
  }
}
