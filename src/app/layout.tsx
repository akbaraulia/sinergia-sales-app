import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ToastProvider } from '@/components/common/ToastProvider'
import { ErrorBoundary, AsyncErrorBoundary } from '@/components/common/ErrorBoundary'
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Sinergia Sales Web",
  description: "Sales management application integrated with ERPNext",
  keywords: ['sales', 'erp', 'management', 'business'],
  authors: [{ name: 'Sinergia Team' }],
  creator: 'Sinergia',
  publisher: 'Sinergia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Sinergia Sales Web',
    description: 'Sales management application integrated with ERPNext',
    url: '/',
    siteName: 'Sinergia Sales Web',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sinergia Sales Web',
    description: 'Sales management application integrated with ERPNext',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <AsyncErrorBoundary>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              storageKey="sinergia-theme"
            >
              <ToastProvider position="top-right" maxToasts={5}>
                <div id="root" className="min-h-screen">
                  {children}
                </div>
              </ToastProvider>
            </ThemeProvider>
          </AsyncErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
