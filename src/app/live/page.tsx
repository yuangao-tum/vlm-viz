'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { ImageUploader } from '@/components/live/ImageUploader'
import { InferencePanel } from '@/components/live/InferencePanel'
import { LayerSelector } from '@/components/live/LayerSelector'
import { AttentionHeatmapOverlay } from '@/components/live/AttentionHeatmapOverlay'
import { TrajectoryRenderer } from '@/components/live/TrajectoryRenderer'

const queryClient = new QueryClient()

export default function LivePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Header />

      <main className="pt-16 px-6 pb-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Live Inference</h1>
          <p className="text-sm text-muted mt-1 font-mono">
            Upload a CARLA driving scene image to run inference through the finetuned Qwen3-VL-2B model and visualize attention patterns + trajectory output.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left panel: controls */}
          <div className="col-span-3 space-y-6">
            <ImageUploader />
            <InferencePanel />
            <LayerSelector />
          </div>

          {/* Center: visualizations */}
          <div className="col-span-9 grid grid-cols-2 gap-6">
            <AttentionHeatmapOverlay />
            <TrajectoryRenderer />
          </div>
        </div>

        {/* Connection status */}
        <div className="mt-8 text-xs text-muted font-mono">
          Backend: {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'} · Model: Qwen3-VL-2B (checkpoint-34230)
        </div>
      </main>
    </QueryClientProvider>
  )
}
