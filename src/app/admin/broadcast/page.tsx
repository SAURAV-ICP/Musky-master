'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface InlineButton {
  text: string;
  url: string;
}

interface InAppBroadcast {
  image: string;
  buttonText: string;
  buttonUrl: string;
}

export default function BroadcastPage() {
  const { user } = useUser();
  const router = useRouter();
  const [broadcastType, setBroadcastType] = useState<'inbot' | 'inapp'>('inbot');
  
  // In-bot broadcast state
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [inlineButtons, setInlineButtons] = useState<InlineButton[]>([]);
  const [isBold, setIsBold] = useState(false);
  
  // In-app broadcast state
  const [inAppBroadcast, setInAppBroadcast] = useState<InAppBroadcast>({
    image: '',
    buttonText: '',
    buttonUrl: ''
  });

  useEffect(() => {
    if (user && !user.is_admin) {
      router.push('/');
    }
  }, [user, router]);

  const handleAddInlineButton = () => {
    setInlineButtons([...inlineButtons, { text: '', url: '' }]);
  };

  const handleRemoveInlineButton = (index: number) => {
    setInlineButtons(inlineButtons.filter((_, i) => i !== index));
  };

  const handleUpdateInlineButton = (index: number, field: keyof InlineButton, value: string) => {
    const updatedButtons = [...inlineButtons];
    updatedButtons[index] = { ...updatedButtons[index], [field]: value };
    setInlineButtons(updatedButtons);
  };

  const handleSendBroadcast = async () => {
    try {
      if (!user?.user_id) {
        toast.error('You must be logged in to send broadcasts');
        return;
      }

      if (broadcastType === 'inbot') {
        if (!message.trim()) {
          toast.error('Message is required for in-bot broadcasts');
          return;
        }

        // Filter out incomplete buttons
        const validButtons = inlineButtons.filter(btn => btn.text && btn.url);

        const response = await fetch('/api/admin/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_id: user.user_id,
            type: 'inbot',
            message: message.trim(),
            image_url: imageUrl.trim() || undefined,
            inline_markup: validButtons.length > 0 ? { buttons: validButtons } : undefined
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send in-bot broadcast');
        }

        toast.success('In-bot broadcast sent successfully');
        setMessage('');
        setImageUrl('');
        setInlineButtons([]);

      } else {
        const { image, buttonText, buttonUrl } = inAppBroadcast;
        
        if (!image || !buttonText || !buttonUrl) {
          toast.error('Image, button text, and button URL are required for in-app broadcasts');
          return;
        }

        const response = await fetch('/api/admin/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_id: user.user_id,
            type: 'inapp',
            image,
            button_text: buttonText,
            button_url: buttonUrl
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send in-app broadcast');
        }

        toast.success('In-app broadcast created successfully');
        setInAppBroadcast({
          image: '',
          buttonText: '',
          buttonUrl: ''
        });
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send broadcast');
    }
  };

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Broadcast Manager</h1>

        {/* Broadcast Type Selector */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setBroadcastType('inbot')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              broadcastType === 'inbot' ? 'bg-accent' : 'bg-black/20'
            }`}
          >
            In-Bot Broadcast
          </button>
          <button
            onClick={() => setBroadcastType('inapp')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              broadcastType === 'inapp' ? 'bg-accent' : 'bg-black/20'
            }`}
          >
            In-App Broadcast
          </button>
        </div>

        {broadcastType === 'inbot' ? (
          // In-bot Broadcast Form
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Message</label>
              <div className="flex items-center space-x-4 mb-2">
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`px-3 py-1 rounded ${
                    isBold ? 'bg-accent' : 'bg-black/20'
                  }`}
                >
                  B
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-black/20 rounded-lg p-4 min-h-[100px]"
                placeholder="Enter your broadcast message..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Image URL (optional)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-black/20 rounded-lg p-4"
                placeholder="Enter image URL..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold">Inline Buttons</label>
                <button
                  onClick={handleAddInlineButton}
                  className="px-3 py-1 rounded bg-accent text-sm"
                >
                  Add Button
                </button>
              </div>
              <div className="space-y-4">
                {inlineButtons.map((button, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => handleUpdateInlineButton(index, 'text', e.target.value)}
                      className="flex-1 bg-black/20 rounded-lg p-4"
                      placeholder="Button text..."
                    />
                    <input
                      type="text"
                      value={button.url}
                      onChange={(e) => handleUpdateInlineButton(index, 'url', e.target.value)}
                      className="flex-1 bg-black/20 rounded-lg p-4"
                      placeholder="Button URL..."
                    />
                    <button
                      onClick={() => handleRemoveInlineButton(index)}
                      className="p-2 rounded bg-red-500/20 text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // In-app Broadcast Form
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Image URL</label>
              <input
                type="text"
                value={inAppBroadcast.image}
                onChange={(e) => setInAppBroadcast({ ...inAppBroadcast, image: e.target.value })}
                className="w-full bg-black/20 rounded-lg p-4"
                placeholder="Enter image URL..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Button Text</label>
              <input
                type="text"
                value={inAppBroadcast.buttonText}
                onChange={(e) => setInAppBroadcast({ ...inAppBroadcast, buttonText: e.target.value })}
                className="w-full bg-black/20 rounded-lg p-4"
                placeholder="Enter button text..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Button URL</label>
              <input
                type="text"
                value={inAppBroadcast.buttonUrl}
                onChange={(e) => setInAppBroadcast({ ...inAppBroadcast, buttonUrl: e.target.value })}
                className="w-full bg-black/20 rounded-lg p-4"
                placeholder="Enter button URL..."
              />
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSendBroadcast}
          className="w-full mt-8 py-4 bg-accent rounded-lg font-semibold"
        >
          {broadcastType === 'inbot' ? 'Send Broadcast' : 'Create Broadcast'}
        </motion.button>
      </div>
    </Layout>
  );
}