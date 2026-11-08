import '@/shared/styles/globals.css';

export const metadata = {
  title: 'RetailOne POS',
  description: 'RetailOne Integrated Retail POS System',
};

// TODO UC69 (Phase 3): wrap children with <AuthProvider>.
export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

