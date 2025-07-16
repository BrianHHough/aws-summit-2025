import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TalkWithDocs - Talk to Your Documents',
  description: 'Upload PDFs and have conversations with your documents using AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
          <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              {children}
              <Toaster />
            </ThemeProvider>
          </SessionProvider>
      </body>
    </html>
  );
}