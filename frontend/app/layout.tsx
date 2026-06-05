// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export const metadata: Metadata = {
  title: { default: 'JPredict — Football Analysis Intelligence', template: '%s · JPredict' },
  description: 'Statistical football analysis and confidence-ranked match predictions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base text-white antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-col flex-1" style={{ marginLeft: 'var(--sidebar-w)' }}>
            <TopBar />
            <main className="flex-1 p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
