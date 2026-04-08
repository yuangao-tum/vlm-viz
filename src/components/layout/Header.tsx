'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useModelStore } from '@/store/modelStore'
import { MODELS, MODEL_IDS } from '@/scene/modelConstants'

export function Header() {
  const path = usePathname()
  const { selectedModelId, selectModel } = useModelStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold font-mono">V</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 font-mono">VLM-Viz</span>
      </div>

      {/* Model selector */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {MODEL_IDS.map((id) => {
          const m = MODELS[id]
          const active = id === selectedModelId
          return (
            <button
              key={id}
              onClick={() => selectModel(id)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                active
                  ? 'bg-white text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.name}
            </button>
          )
        })}
      </div>

      {/* Page nav */}
      <nav className="flex items-center gap-1">
        <NavLink href="/walkthrough" label="Architecture" active={path?.startsWith('/walkthrough')} />
        <NavLink href="/finetuning" label="Finetuning" active={path?.startsWith('/finetuning')} />
        <NavLink href="/live" label="Live Inference" active={path?.startsWith('/live')} />
      </nav>
    </header>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  )
}
