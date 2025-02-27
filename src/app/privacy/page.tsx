'use client';

import React from 'react';
import Layout from '@/components/layout/Layout';

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="bg-primary/20 rounded-xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            When you use the Musky Mini App, we collect the following information:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your Telegram user ID and username</li>
            <li>Your TON wallet address (when connected)</li>
            <li>App usage data and activity</li>
            <li>Referral information</li>
          </ul>
          
          <h2 className="text-xl font-bold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use the collected information for the following purposes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>To provide and maintain the app's functionality</li>
            <li>To track your progress and rewards</li>
            <li>To manage referrals and distribute referral rewards</li>
            <li>To improve the app based on usage patterns</li>
            <li>To communicate with you about updates and changes</li>
          </ul>
          
          <h2 className="text-xl font-bold mb-4">3. Data Storage</h2>
          <p className="mb-4">
            Your data is stored securely in our database. We use industry-standard security measures to protect your information from unauthorized access or disclosure.
          </p>
          
          <h2 className="text-xl font-bold mb-4">4. Data Sharing</h2>
          <p className="mb-4">
            We do not sell or share your personal information with third parties except in the following cases:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>When required by law</li>
            <li>To protect our rights and safety</li>
            <li>With service providers who help us operate the app (under confidentiality agreements)</li>
          </ul>
          
          <h2 className="text-xl font-bold mb-4">5. Your Rights</h2>
          <p className="mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
          </ul>
          
          <h2 className="text-xl font-bold mb-4">6. Cookies and Tracking</h2>
          <p className="mb-4">
            The app may use cookies and similar tracking technologies to enhance your experience and collect information about how you use the app.
          </p>
          
          <h2 className="text-xl font-bold mb-4">7. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>
          
          <h2 className="text-xl font-bold mb-4">8. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this privacy policy, please contact us through the Telegram bot.
          </p>
        </div>
      </div>
    </Layout>
  );
} 