import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 via-purple-900 to-slate-900 animate-gradient-shift -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.2),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.2),transparent_50%)] -z-10"></div>
      
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-lg">Loading...</p>
      </div>
    </div>
  )
}
