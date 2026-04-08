'use client'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { CommentaryPanel } from '@/components/layout/CommentaryPanel'

const SceneCanvas = dynamic(
  () => import('@/components/scene/SceneCanvas').then((m) => m.SceneCanvas),
  { ssr: false }
)

const WalkthroughController = dynamic(
  () => import('@/components/walkthrough/WalkthroughController').then((m) => m.WalkthroughController),
  { ssr: false }
)

export default function WalkthroughPage() {
  return (
    <>
      <Header />

      {/* Full-screen 3D viewport */}
      <div className="fixed inset-0 z-0">
        <SceneCanvas>
          <WalkthroughController />
        </SceneCanvas>
      </div>

      {/* Commentary panel (appears on hover/click) */}
      <CommentaryPanel />
    </>
  )
}
