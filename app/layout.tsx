import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './landscape.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

// Farcaster Mini App Metadata
const APP_URL = 'https://reda-hoarse-refinedly.ngrok-free.dev';

const miniappEmbed = {
  version: "1",
  imageUrl: `${APP_URL}/assets/buildings/castle.png`,
  button: {
    title: "Play Dragon City",
    action: {
      type: "launch_miniapp",
      url: APP_URL,
      name: "Dragon City",
      splashImageUrl: `${APP_URL}/assets/buildings/castle.png`,
      splashBackgroundColor: "#1e1b4b",
    },
  },
};

const miniappJson = JSON.stringify(miniappEmbed);
const frameJson = miniappJson.replace(/launch_miniapp/g, "launch_frame");

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: '🐉 Dragon City - Cross-Chain Dragon Game',
  description: 'Breed, battle, and collect pixel art dragons on Base & Celo. Farcaster Mini App.',
  openGraph: {
    title: '🐉 Dragon City',
    description: 'Breed, battle, and collect pixel art dragons on Base & Celo',
    images: [`${APP_URL}/assets/buildings/castle.png`],
    url: APP_URL,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🐉 Dragon City',
    description: 'Breed, battle, and collect pixel art dragons',
    images: [`${APP_URL}/assets/buildings/castle.png`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/assets/buildings/castle.png`,
    'fc:frame:button:1': 'Play Dragon City',
    'fc:frame:button:1:action': 'launch_frame',
    'fc:frame:button:1:target': APP_URL,
    'fc:miniapp': miniappJson,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="screen-orientation" content="landscape" />
        
        {/* Farcaster Frame Meta Tags */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${APP_URL}/assets/buildings/castle.png`} />
        <meta property="fc:frame:button:1" content="Play Dragon City" />
        <meta property="fc:frame:button:1:action" content="launch_frame" />
        <meta property="fc:frame:button:1:target" content={APP_URL} />
        
        <style dangerouslySetInnerHTML={{__html: `
          /* Force landscape mode on mobile */
          @media screen and (max-width: 768px) and (orientation: portrait) {
            html {
              transform: rotate(90deg);
              transform-origin: left top;
              width: 100vh;
              height: 100vw;
              overflow-x: hidden;
              position: absolute;
              top: 100%;
              left: 0;
            }
            body {
              width: 100vh;
              height: 100vw;
              overflow: hidden;
            }
          }
          
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            position: fixed;
            margin: 0;
            padding: 0;
          }
        `}} />
      </head>
      <body className={inter.className}>
        {/* Landscape orientation prompt for mobile */}
        <div className="landscape-prompt">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8"/>
            <path d="M12 17v4"/>
          </svg>
          <h2>Please Rotate Your Device</h2>
          <p>This game is best experienced in landscape mode</p>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
