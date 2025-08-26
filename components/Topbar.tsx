'use client'

import { Menu } from './icons'

interface TopbarProps {
  title: string
  subtitle?: string
  onToggleSidebar: () => void
}

export default function Topbar({ title, subtitle, onToggleSidebar }: TopbarProps) {

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-[#ADB3BD]/30 px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-[#4F5F73] hover:text-[#111C59] hover:bg-[#111C59]/5 transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-[#0F1626]">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[#4F5F73]">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Section - Empty for now */}
    </header>
  )
}
