'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

export default function AdminBroadcastPage() {
  const { user, loading } = useUser();
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [expiryDays, setExpiryDays] = useState('7');
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.user_id && user.is_admin) {
      fetchBroadcastMessages();
    }
  }, [user]);

  const fetchBroadcastMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching broadcast messages:', error);
      toast.error('Failed to load broadcast messages');
    }
  };

  const handleSendMessage = async () => {
    if (!user?.is_admin) {
      toast.error('You do not have permission to send broadcast messages');
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error('Please provide both title and content for the message');
      return;
    }

    setIsSending(true);
    try {
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays || '7'));

      // Create new broadcast message
      const { error } = await supabase
        .from('broadcast_messages')
        .insert({
          title: title.trim(),
          content: content.trim(),
          type: messageType,
          active: true,
          expires_at: expiryDate.toISOString(),
          created_by: user.user_id
        });

      if (error) throw error;

      // Clear form and refresh messages
      setTitle('');
      setContent('');
      setMessageType('info');
      setExpiryDays('7');
      await fetchBroadcastMessages();

      toast.success('Broadcast message sent successfully');
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      toast.error('Failed to send broadcast message');
    } finally {
      setIsSending(false);
    }
  };

  const toggleMessageStatus = async (messageId: string, currentStatus: boolean) => {
    if (!user?.is_admin) return;

    try {
      const { error } = await supabase
        .from('broadcast_messages')
        .update({ active: !currentStatus })
        .eq('id', messageId);

      if (error) throw error;
      await fetchBroadcastMessages();

      toast.success(`Message ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user?.is_admin) return;

    setIsDeleting(true);
    setSelectedMessage(messageId);

    try {
      const { error } = await supabase
        .from('broadcast_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      await fetchBroadcastMessages();

      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsDeleting(false);
      setSelectedMessage(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user?.is_admin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/20 p-6 rounded-xl text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-white/60">You do not have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Broadcast Messages</h1>

        {/* Create New Message Form */}
        <div className="bg-primary-dark rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Send New Broadcast</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 mb-2">Message Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter message title"
                className="w-full bg-black/20 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-2">Message Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter message content"
                rows={4}
                className="w-full bg-black/20 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 mb-2">Message Type</label>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as any)}
                  className="w-full bg-black/20 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="info">Information</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-white/60 mb-2">Expiry (Days)</label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  min="1"
                  max="30"
                  className="w-full bg-black/20 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="pt-4">
              <motion.button
                className="px-6 py-3 bg-accent hover:bg-accent/80 rounded-lg font-bold w-full md:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSending || !title.trim() || !content.trim()}
                onClick={handleSendMessage}
              >
                {isSending ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Sending...
                  </span>
                ) : (
                  'Send Broadcast Message'
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Message Preview */}
        {(title || content) && (
          <div className="bg-primary-dark rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Message Preview</h2>
            <div className={`p-4 rounded-lg ${
              messageType === 'info' ? 'bg-blue-500/20 border border-blue-500/30' :
              messageType === 'success' ? 'bg-green-500/20 border border-green-500/30' :
              messageType === 'warning' ? 'bg-orange-500/20 border border-orange-500/30' :
              'bg-red-500/20 border border-red-500/30'
            }`}>
              <h3 className={`font-bold text-lg ${
                messageType === 'info' ? 'text-blue-400' :
                messageType === 'success' ? 'text-green-400' :
                messageType === 'warning' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {title || 'Message Title'}
              </h3>
              <p className="mt-2 whitespace-pre-wrap">
                {content || 'Message content will appear here...'}
              </p>
            </div>
          </div>
        )}

        {/* Active Messages */}
        <h2 className="text-xl font-bold mb-4">Active Broadcasts</h2>
        {messages.filter(m => m.active).length === 0 ? (
          <div className="bg-primary-dark rounded-xl p-6 text-center mb-8">
            <p className="text-white/60">No active broadcast messages</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {messages.filter(m => m.active).map((message) => (
              <div 
                key={message.id}
                className={`bg-primary-dark rounded-xl p-6 ${
                  selectedMessage === message.id ? 'border-2 border-accent' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        message.type === 'info' ? 'bg-blue-400' :
                        message.type === 'success' ? 'bg-green-400' :
                        message.type === 'warning' ? 'bg-orange-400' :
                        'bg-red-400'
                      }`}></span>
                      <h3 className="font-bold text-lg">{message.title}</h3>
                    </div>
                    <p className="text-white/60 text-sm mt-1">
                      Created: {formatDate(message.created_at)}
                      {message.expires_at && ` • Expires: ${formatDate(message.expires_at)}`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        message.active
                          ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                      onClick={() => toggleMessageStatus(message.id, message.active)}
                    >
                      {message.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-sm font-medium"
                      onClick={() => deleteMessage(message.id)}
                      disabled={isDeleting && selectedMessage === message.id}
                    >
                      {isDeleting && selectedMessage === message.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inactive Messages */}
        <h2 className="text-xl font-bold mb-4">Inactive Broadcasts</h2>
        {messages.filter(m => !m.active).length === 0 ? (
          <div className="bg-primary-dark rounded-xl p-6 text-center">
            <p className="text-white/60">No inactive broadcast messages</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.filter(m => !m.active).map((message) => (
              <div 
                key={message.id}
                className={`bg-primary-dark rounded-xl p-6 opacity-70 ${
                  selectedMessage === message.id ? 'border-2 border-accent' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        message.type === 'info' ? 'bg-blue-400/50' :
                        message.type === 'success' ? 'bg-green-400/50' :
                        message.type === 'warning' ? 'bg-orange-400/50' :
                        'bg-red-400/50'
                      }`}></span>
                      <h3 className="font-bold text-lg">{message.title}</h3>
                    </div>
                    <p className="text-white/60 text-sm mt-1">
                      Created: {formatDate(message.created_at)}
                      {message.expires_at && ` • Expired: ${formatDate(message.expires_at)}`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded text-sm font-medium"
                      onClick={() => toggleMessageStatus(message.id, message.active)}
                    >
                      Activate
                    </button>
                    <button
                      className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-sm font-medium"
                      onClick={() => deleteMessage(message.id)}
                      disabled={isDeleting && selectedMessage === message.id}
                    >
                      {isDeleting && selectedMessage === message.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}