// app/layout.tsx
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import ClientOnly from "@/components/client-only";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning helps ignore initial mismatch */}
      <head />
      <body className={`${geistSans.className} bg-background text-foreground`}>
        {/* ThemeProvider must wrap entire body */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientOnly>
            <main className="min-h-screen flex flex-col items-center">
              <header className="w-full border-b p-4 text-sm font-semibold">
                <Link href="/">watch&learn</Link>
              </header>
              <div className="flex-1 w-full max-w-4xl p-6">{children}</div>
            </main>
          </ClientOnly>
        </ThemeProvider>
      </body>
    </html>
  );
}
