import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppearanceProvider } from '@/components/appearance-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TMUSync',
  description: 'University Schedule Integration Dashboard',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${playfair.variable} antialiased relative overflow-x-hidden`} suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AppearanceProvider>
            {/* Ambient Background Layers */}
            <div className="fixed inset-0 -z-30 w-full h-full bg-background transition-colors duration-500" />

            {/* Cinematic Grain Overlay - Moved behind Aurora to reduce interference with cards */}
            <div
              className="fixed inset-0 -z-25 w-full h-full bg-noise pointer-events-none mix-blend-overlay transition-opacity duration-300"
              style={{ opacity: 'var(--noise-opacity, 0.03)' }}
            ></div>

            {/* Aurora Gradient Mesh - Opacity controlled by variable */}
            <div
              className="fixed inset-0 -z-20 w-full h-full blur-[80px] saturate-150 overflow-hidden pointer-events-none transition-opacity duration-300"
              style={{ opacity: 'var(--aurora-opacity, 0.6)' }}
            >
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/50 dark:bg-purple-900/40 animate-blob mix-blend-multiply dark:mix-blend-color-dodge filter blur-3xl"></div>
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/50 dark:bg-blue-900/40 animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-color-dodge filter blur-3xl"></div>
              <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-200/50 dark:bg-indigo-900/40 animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-color-dodge filter blur-3xl"></div>
            </div>

            {children}
          </AppearanceProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}