import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react';
import type { Color } from '@tonconnect/ui-react';

// Get the correct manifest URL based on environment
const manifestUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.host}/tonconnect-manifest.json`
  : 'https://musky-mini-app.vercel.app/tonconnect-manifest.json';

interface TonConnectProviderProps {
  children: React.ReactNode;
}

export function TonConnectProvider({ children }: TonConnectProviderProps) {
  // Get the current origin with protocol
  const origin = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://musky-mini-app.vercel.app';

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: origin as `${string}://${string}`,
        skipRedirectToWallet: "always" // Important for Telegram Mini App
      }}
      uiPreferences={{
        theme: THEME.DARK,
        colorsSet: {
          [THEME.DARK]: {
            background: {
              primary: '#0D47A1',
              secondary: '#1565C0'
            },
            text: {
              primary: '#FFFFFF',
              secondary: '#E3F2FD'
            }
          }
        }
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
} 