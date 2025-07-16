import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,

    pages: {
        signIn: "/login",
        error: "/login/error",
    },
    session: {
        strategy: "jwt",
        maxAge: 60 * 60,
    },

    callbacks: {
        async signIn({ user }) {
            const allowedEmails = ["thanyapisit.lim@g.swu.ac.th"]
            return user.email && allowedEmails.includes(user.email)
        },

        async jwt({ token, user }) {
            if (user) {
                token.email = user.email
                token.verified = false // ให้ผ่าน Google ก่อน → OTP ยังไม่ผ่าน
            }
            return token
        },

        async session({ session, token }) {
            session.email = token.email
            session.verified = token.verified
            return session
        },
        async redirect({ baseUrl }) {
            // หลังล็อกอิน ให้ไป /otp-login เสมอ
            return `${baseUrl}/login/otp-login`;
        },
    },
})

export { handler as GET, handler as POST }
