import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/components/Toast';

export const metadata: Metadata = {
  title: 'AttendFlow - Attendance Management System',
  description: 'Modern attendance management system for educational institutions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-bg">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
