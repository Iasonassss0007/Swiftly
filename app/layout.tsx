import type { Metadata } from 'next'
import { Libre_Franklin } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const libreFranklin = Libre_Franklin({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-libre-franklin'
})

export const metadata: Metadata = {
  title: 'Swiftly - AI-Powered Admin Life Concierge',
  description: 'Simplify scheduling, task management, reminders, and productivity optimization with Swiftly\'s intelligent automation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={libreFranklin.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
