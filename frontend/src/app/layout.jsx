import '@/shared/styles/globals.css';
import { AuthProvider } from '@/features/auth';

export const metadata = {
  title: 'RetailOne POS',
  description: 'RetailOne Integrated Retail POS System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
