// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Đảm bảo bạn đã có file CSS này
import { ThemeProvider } from '@/components/theme-provider'; // Đường dẫn tới component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Veo 3 Batch Generator',
  description: 'Generate multiple video scenes in batch',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Set dark mode làm mặc định
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}