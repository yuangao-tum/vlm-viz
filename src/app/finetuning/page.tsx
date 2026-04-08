'use client'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { StageSelector } from '@/components/finetuning/StageSelector'
import { ComponentDetailPanel } from '@/components/finetuning/ComponentDetailPanel'
import { LossBreakdownPanel } from '@/components/finetuning/LossBreakdownPanel'

const SceneCanvas = dynamic(
  () => import('@/components/scene/SceneCanvas').then((m) => m.SceneCanvas),
  { ssr: false }
)

const FinetuningScene = dynamic(
  () => import('@/components/scene/finetuning/FinetuningScene').then((m) => m.FinetuningScene),
  { ssr: false }
)

export default function FinetuningPage() {
  return (
    <>
      <Header />

      {/* Full-screen 3D viewport */}
      <div className="fixed inset-0 z-0">
        <SceneCanvas>
          <FinetuningScene />
        </SceneCanvas>
      </div>

      {/* Left sidebar: stage selector + loss breakdown */}
      <div className="fixed left-0 top-14 bottom-0 w-72 z-20 p-4 overflow-y-auto">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-lg space-y-6">
          <StageSelector />
          <div className="border-t border-gray-100 pt-4">
            <LossBreakdownPanel />
          </div>
        </div>
      </div>

      {/* Right panel: component detail (appears on click) */}
      <ComponentDetailPanel />
    </>
  )
}
