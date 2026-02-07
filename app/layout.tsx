import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🌊 Alerta Marejadas — Bahía de Banderas',
  description:
    'Predicción de riesgo de inundación en playas de Bahía de Banderas. Mareas + oleaje + fase lunar.',
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/icon-192.png', sizes: '192x192' },
    { rel: 'apple-touch-icon', url: '/icon-192.png' },
  ],
};

export const viewport: Viewport = {
  themeColor: '#0C1222',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-[#0C1222] text-white min-h-screen">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
