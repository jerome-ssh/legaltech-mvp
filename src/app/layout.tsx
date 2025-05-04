import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeProvider";
import SidebarLayout from "@/components/layout/SidebarLayout";

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
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <SidebarLayout>
            {children}
          </SidebarLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
