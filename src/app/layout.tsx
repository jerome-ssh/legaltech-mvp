import type { Metadata } from 'next';
import ClientRootLayout from './ClientRootLayout';

export const metadata: Metadata = {
  title: 'LawMate - Legal Practice Management',
  description: 'Streamline your legal practice with LawMate - the all-in-one legal practice management solution.',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LawMate',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientRootLayout>{children}</ClientRootLayout>;
}
