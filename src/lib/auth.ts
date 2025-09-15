import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { fetchSensor } from "./sensor";
// Instantiate fetchSensor
const sensor = new fetchSensor();

export const authOptions: NextAuthOptions = {
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
      // Fetch allowed emails with a default fallback
      const allowedEmails = (await sensor.getEmails()) ?? [
        "thanyapisit.lim@g.swu.ac.th",
        "taka20061016@gmail.com",
      ];
      return Boolean(user.email && allowedEmails.includes(user.email));
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.verified = true;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.verified = token.verified;
      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl; // redirect to /
    },
  },
};