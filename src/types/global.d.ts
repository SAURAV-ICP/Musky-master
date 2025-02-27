interface Window {
  Telegram?: {
    WebApp: {
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