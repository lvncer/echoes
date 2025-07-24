import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ServiceProvider } from "@/lib/contexts/service-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Echoes",
  description: "Echoes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ServiceProvider>
      </body>
    </html>
  );
}
