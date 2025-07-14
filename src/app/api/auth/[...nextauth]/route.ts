import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import jwt from "jsonwebtoken"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      const allowedEmails = ["thanyapisit.lim@gmail.com", "asd"]
      if (user.email && allowedEmails.includes(user.email)) {
        return true // ผ่าน!
      }
      return false // ไม่ผ่าน!
    },

    async jwt({ token, user }) {
      if (user) {
        const myToken = jwt.sign(
          { email: user.email, name: user.name },
          process.env.JWT_SECRET!,
          { expiresIn: "1h" }
        )
        token.myJwt = myToken
      }
      return token
    },

    async session({ session, token }) {
      session.myJwt = token.myJwt
      return session
    },
  },
})

export { handler as GET, handler as POST }
