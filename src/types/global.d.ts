interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramWebAppUser;
  auth_date?: string;
  hash?: string;
  start_param?: string;
}

interface TelegramWebAppWalletResult {
  address: string;
  balance: {
    ton?: string;
    stars?: string;
  };
}

interface TelegramWebAppPaymentParams {
  amount: number;
  currency: string;
  description?: string;
  payload?: string;
}

interface TelegramWebAppPaymentResult {
  success: boolean;
  transaction_id?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  expand: () => void;
  close: () => void;
  ready: () => void;
  showPopup: (params: any, callback: Function) => void;
  showAlert: (message: string, callback?: Function) => void;
  showConfirm: (message: string, callback: Function) => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: Function) => void;
    offClick: (callback: Function) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: Function) => void;
    offClick: (callback: Function) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  requestWallet: () => Promise<TelegramWebAppWalletResult>;
  requestPayment: (params: TelegramWebAppPaymentParams) => Promise<TelegramWebAppPaymentResult>;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback: Function) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
}

interface Window {
  Telegram?: {
    WebApp: {
      initDataUnsafe?: {
        user?: {
          id: number;
          first_name?: string;
          last_name?: string;
          username?: string;
        };
      };
      requestWallet: () => Promise<{
        address: string;
        balance: {
          ton?: string;
          stars?: string;
        };
      }>;
      requestPayment: (params: {
        amount: number;
        currency: string;
      }) => Promise<{
        success: boolean;
      }>;
    };
  };
} 