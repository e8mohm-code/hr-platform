import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Cairo } from 'next/font/google';
import './globals.css';

const ibmPlex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'منصة الموارد البشرية',
  description: 'إدارة الامتثال ومتابعة انتهاء الوثائق للمنشآت السعودية',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlex.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased text-body text-gray-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
