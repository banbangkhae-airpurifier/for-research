import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "../globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Air Purifier App",
  description: "Clean and healthy air control system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${urbanist.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
