'use client';

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence for popup
import { toast } from 'react-hot-toast';

interface InlineButton {
  text: string;
  url: string;
}

export default function BroadcastPage() {
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<InlineButton[]>([]);
  const [newButton, setNewButton] = useState<InlineButton>({ text: '', url: '' });
  const [isSending, setIsSending] = useState(false);
  const [isPopupPreview, setIsPopupPreview] = useState(false); // New state for previewing popup

  const handleAddButton = () => {
    if (newButton.text && newButton.url) {
      setButtons([...buttons, newButton]);
      setNewButton({ text: '', url: '' });
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleSendBroadcast = async () => {
    if (!message) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: process.env.NEXT_PUBLIC_ADMIN_ID,
          message,
          inline_markup: buttons.length > 0 ? { buttons } : undefined,
          type: 'popup', // Indicate this is a popup broadcast
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setMessage('');
        setButtons([]);
        setIsPopupPreview(false); // Close preview after sending
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send broadcast');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  // Popup preview for admin to test
  const handlePreviewPopup = () => {
    if (!message) {
      toast.error('Please enter a message to preview');
      return;
    }
    setIsPopupPreview(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Admin Broadcast</h1>
            <p className="text-white/60">Send messages or popups to all users</p>
          </div>

          <div className="space-y-6">
            {/* Message Input */}
            <div className="bg-primary/20 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Message</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your broadcast message..."
                className="w-full h-32 bg-background/50 rounded-lg p-4 text-white resize-none"
              />
              <p className="text-sm text-white/60 mt-2">
                HTML formatting is supported
              </p>
            </div>

            {/* Inline Buttons */}
            <div className="bg-primary/20 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Inline Buttons</h3>
              
              {/* Existing Buttons */}
              {buttons.length > 0 && (
                <div className="space-y-2 mb-4">
                  {buttons.map((button, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-background/50 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-bold">{button.text}</p>
                        <p className="text-sm text-white/60">{button.url}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveButton(index)}
                        className="text-red-400"
                      >
                        ✕
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Button */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={newButton.text}
                  onChange={(e) => setNewButton({ ...newButton, text: e.target.value })}
                  placeholder="Button Text"
                  className="w-full bg-background/50 rounded-lg p-3"
                />
                <input
                  type="text"
                  value={newButton.url}
                  onChange={(e) => setNewButton({ ...newButton, url: e.target.value })}
                  placeholder="Button URL"
                  className="w-full bg-background/50 rounded-lg p-3"
                />
                <motion.button
                  className="w-full py-3 bg-accent/80 hover:bg-accent rounded-lg font-bold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddButton}
                >
                  Add Button
                </motion.button>
              </div>
            </div>

            {/* Preview and Send Buttons */}
            <div className="space-y-4">
              <motion.button
                className="w-full py-3 bg-blue-500/80 hover:bg-blue-500 rounded-lg font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePreviewPopup}
                disabled={isSending}
              >
                Preview Popup
              </motion.button>
              
              <motion.button
                className={`w-full py-4 rounded-xl font-bold ${
                  isSending ? 'bg-gray-500' : 'bg-accent'
                }`}
                whileHover={!isSending ? { scale: 1.02 } : {}}
                whileTap={!isSending ? { scale: 0.98 } : {}}
                onClick={handleSendBroadcast}
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send Broadcast'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Popup Preview for Admin */}
        <AnimatePresence>
          {isPopupPreview && (
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPopupPreview(false)}
            >
              <motion.div
                className="bg-primary/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full m-4"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Broadcast Preview</h2>
                  <button onClick={() => setIsPopupPreview(false)}>✕</button>
                </div>
                <p className="text-white mb-4">{message}</p>
                {buttons.length > 0 && (
                  <div className="space-y-2">
                    {buttons.map((button, index) => (
                      <motion.button
                        key={index}
                        className="w-full py-2 bg-accent rounded-lg font-bold text-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.open(button.url, '_blank')}
                      >
                        {button.text}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}