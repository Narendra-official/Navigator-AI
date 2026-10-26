import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenSource Navigator AI — Your AI guide to your first open-source contribution',
  description:
    'Discover real GitHub issues, assess skill levels, and generate structured contribution roadmaps powered by local open-weight AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="spatial-mesh-bg text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
