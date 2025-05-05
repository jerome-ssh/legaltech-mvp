import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "LegalTech MVP",
  description: "LegalTech MVP Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ClientLayout>
            {children}
          </ClientLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}
