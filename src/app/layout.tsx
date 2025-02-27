'use client';

import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/contexts/UserContext'
import { TonConnectProvider } from '@/components/providers/TonConnectProvider'
import { Toaster } from 'react-hot-toast'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <TonConnectProvider>
          <UserProvider>
            {children}
            <Toaster position="bottom-center" />
          </UserProvider>
        </TonConnectProvider>
      </body>
    </html>
  )
} 