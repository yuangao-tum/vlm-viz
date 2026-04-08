import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VLM-Viz — Qwen3-VL-2B Architecture Visualization',
  description: 'Interactive 3D walkthrough of the Qwen3-VL-2B Vision Language Model for autonomous driving trajectory prediction.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
