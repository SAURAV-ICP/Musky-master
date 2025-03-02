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