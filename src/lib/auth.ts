import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

// Define Home Assistant URL and token
const habaseURL: string = 'https://ob2s2wfi0mp5smcvcbz8rydvzt2hlvwk.ui.nabu.casa'; // Replace with actual URL
const hatoken: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwNDEzNmRkYTA3ODE0ODY4YmIwMWU4NmJlZWY0MDA2MiIsImlhdCI6MTc0OTcwNDQ0NCwiZXhwIjoyMDY1MDY0NDQ0fQ.XshdadBtHNeAv0_L-X69q_lwTPm6fYKSh-zTsvgymvE'; // Replace with actual token

// Function to fetch allowed emails from Home Assistant
const getEmails = async (signal?: AbortSignal): Promise<string[] | undefined> => {
    const url = `${habaseURL}/api/states/input_text.allowed_emails`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${hatoken}` }, // Use hatoken directly
            signal
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        
        if (!json.state) {
            console.error(":x: No state found for input_text.allowed_emails");
            return undefined;
        }

        // Parse the JSON string into an array and trim each email
        const emailArray = JSON.parse(json.state) as string[];
        return emailArray.map(email => email.trim());
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return undefined;
        }
        console.error(`❌ Can't fetch emails:`, error);
        return undefined;
    }
};

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
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      // Fetch allowed emails with a default fallback
      const allowedEmails = (await getEmails()) ?? [
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