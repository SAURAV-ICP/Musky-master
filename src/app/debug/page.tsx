'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';

export default function DebugPage() {
  const { user, loading, error, mutate } = useUser();
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminId, setAdminId] = useState<string>('');

  useEffect(() => {
    if (user?.user_id) {
      fetchDebugData(user.user_id);
    }
  }, [user]);

  const fetchDebugData = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/debug/user?user_id=${userId}`);
      const data = await response.json();
      setDebugData(data);
      
      if (data.adminCheck?.adminId) {
        setAdminId(data.adminCheck.adminId);
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
      toast.error('Failed to fetch debug data');
    } finally {
      setIsLoading(false);
    }
  };

  const fixAdminStatus = async () => {
    if (!user?.user_id) return;
    
    try {
      setIsLoading(true);
      toast.loading('Fixing admin status...');
      
      const response = await fetch('/api/admin/fix-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          is_admin: user.user_id === adminId
        }),
      });
      
      if (response.ok) {
        toast.dismiss();
        toast.success('Admin status fixed successfully');
        mutate(); // Refresh user data
        fetchDebugData(user.user_id); // Refresh debug data
      } else {
        const errorData = await response.json();
        toast.dismiss();
        toast.error(`Failed to fix admin status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fixing admin status:', error);
      toast.dismiss();
      toast.error('Failed to fix admin status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">User Debug Information</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-lg">Loading user data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-2">Error Loading User</h2>
            <p>{String(error)}</p>
          </div>
        ) : !user ? (
          <div className="bg-yellow-500/20 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-2">No User Found</h2>
            <p>You are not currently logged in or your user data could not be loaded.</p>
          </div>
        ) : (
          <>
            <div className="bg-primary-dark p-6 rounded-xl mb-6">
              <h2 className="text-xl font-bold mb-4">User Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-sm text-white/60">User ID:</p>
                  <p className="font-mono">{user.user_id}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-sm text-white/60">Admin Status:</p>
                  <p className={`font-bold ${user.is_admin ? 'text-green-500' : 'text-red-500'}`}>
                    {user.is_admin ? 'Admin' : 'Regular User'}
                  </p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-sm text-white/60">MUSKY Balance:</p>
                  <p className="font-bold">{user.balance.toLocaleString()}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-sm text-white/60">Solana Balance:</p>
                  <p className="font-bold">{user.solana_balance.toLocaleString()} SOL</p>
                </div>
              </div>
            </div>
            
            {debugData && (
              <div className="bg-primary-dark p-6 rounded-xl mb-6">
                <h2 className="text-xl font-bold mb-4">Admin Check</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-sm text-white/60">Is Admin Flag:</p>
                    <p className={`font-bold ${debugData.adminCheck.isAdmin ? 'text-green-500' : 'text-red-500'}`}>
                      {debugData.adminCheck.isAdmin ? 'True' : 'False'}
                    </p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-sm text-white/60">Admin ID Match:</p>
                    <p className={`font-bold ${debugData.adminCheck.isAdminId ? 'text-green-500' : 'text-red-500'}`}>
                      {debugData.adminCheck.isAdminId ? 'True' : 'False'}
                    </p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-sm text-white/60">Admin ID:</p>
                    <p className="font-mono">{debugData.adminCheck.adminId}</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-sm text-white/60">Environment:</p>
                    <p className="font-mono">{debugData.environment.nodeEnv}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-2">Fix Admin Status</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="Admin ID"
                      className="bg-black/20 p-3 rounded-lg flex-grow"
                    />
                    <button
                      onClick={fixAdminStatus}
                      disabled={isLoading}
                      className="bg-orange-500 hover:bg-orange-400 py-3 px-6 rounded-lg font-bold disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Fix Admin Status'}
                    </button>
                  </div>
                  <p className="text-sm text-white/60 mt-2">
                    This will update your admin status based on whether your user ID matches the admin ID.
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-primary-dark p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4">Troubleshooting</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Make sure your Telegram Mini App is properly configured</li>
                <li>Check that the NEXT_PUBLIC_ADMIN_ID environment variable is set correctly</li>
                <li>Verify that your user ID matches the admin ID if you should be an admin</li>
                <li>Try refreshing the page or logging out and back in</li>
              </ul>
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    if (user?.user_id) {
                      fetchDebugData(user.user_id);
                    }
                    mutate();
                  }}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-400 py-3 px-6 rounded-lg font-bold disabled:opacity-50"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
} 