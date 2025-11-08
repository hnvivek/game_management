import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameHub - Bengaluru's Premier Sports Platform",
  description: "Book sports venues, join teams, and play matches in Bengaluru. The ultimate sports community platform for athletes and enthusiasts.",
  keywords: ["GameHub", "sports", "Bengaluru", "venue booking", "team management", "matches", "sports community"],
  authors: [{ name: "GameHub Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "GameHub - Bengaluru's Sports Community Platform",
    description: "Book sports venues, join competitive teams, and experience the thrill of sports in Bengaluru",
    url: "https://gamehub.in",
    siteName: "GameHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameHub - Bengaluru's Premier Sports Platform",
    description: "Book sports venues, join teams, and play matches in Bengaluru",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
