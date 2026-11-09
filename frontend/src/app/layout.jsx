import '@/shared/styles/globals.css';
import { AuthProvider } from '@/features/auth';

export const metadata = {
  title: 'RetailOne POS',
  description: 'RetailOne — Hệ thống quản trị bán lẻ và bán hàng tại quầy',
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
