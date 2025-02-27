'use client';

import React from 'react';
import Layout from '@/components/layout/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Terms of Use</h1>
        
        <div className="bg-primary/20 rounded-xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using the Musky Mini App, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this app.
          </p>
          
          <h2 className="text-xl font-bold mb-4">2. Use of the App</h2>
          <p className="mb-4">
            The Musky Mini App is a Telegram Mini App that allows users to earn, stake, and manage MUSKY tokens. Users can participate in mining, staking, and referral programs to earn rewards.
          </p>
          
          <h2 className="text-xl font-bold mb-4">3. User Accounts</h2>
          <p className="mb-4">
            To use certain features of the app, you must have a Telegram account and connect your TON wallet. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>
          
          <h2 className="text-xl font-bold mb-4">4. Tokens and Rewards</h2>
          <p className="mb-4">
            MUSKY tokens earned within the app have no real-world monetary value and are for entertainment purposes only. The app does not guarantee any specific rewards or earnings.
          </p>
          
          <h2 className="text-xl font-bold mb-4">5. Prohibited Activities</h2>
          <p className="mb-4">
            Users are prohibited from:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Using automated scripts or bots to interact with the app</li>
            <li>Attempting to manipulate or exploit the app's systems</li>
            <li>Creating multiple accounts to gain unfair advantages</li>
            <li>Engaging in any activity that disrupts the app's functionality</li>
          </ul>
          
          <h2 className="text-xl font-bold mb-4">6. Limitation of Liability</h2>
          <p className="mb-4">
            The app and its creators are not liable for any damages or losses resulting from the use of the app, including but not limited to, loss of data, profits, or any other intangible losses.
          </p>
          
          <h2 className="text-xl font-bold mb-4">7. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time. Your continued use of the app after any changes indicates your acceptance of the modified terms.
          </p>
          
          <h2 className="text-xl font-bold mb-4">8. Contact Information</h2>
          <p className="mb-4">
            For any questions regarding these terms, please contact us through the Telegram bot.
          </p>
        </div>
      </div>
    </Layout>
  );
} 