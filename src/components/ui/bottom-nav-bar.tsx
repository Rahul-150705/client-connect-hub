"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { LayoutDashboard, Sparkles, FileText, ShieldCheck, Bell, User } from "lucide-react"

// Matches Layout.tsx exactly
const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/chat", label: "AI Chat", icon: Sparkles },
  { path: "/policies", label: "Policies", icon: FileText },
  { path: "/renewals", label: "Renewals", icon: ShieldCheck },
  { path: "/messages", label: "Messages", icon: Bell },
]

const MOBILE_LABEL_WIDTH = 72

interface BottomNavBarProps {
  className?: string
  stickyBottom?: boolean
}

export default function BottomNavBar({
  className,
  stickyBottom = false,
}: BottomNavBarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // Keep track of active index based on current path
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const currentIndex = navItems.findIndex(item => location.pathname.startsWith(item.path))
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex)
    }
  }, [location.pathname])

  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "bg-[#0d0c0e] border border-[#1e1c1f] rounded-full flex flex-col items-center p-2 shadow-xl space-y-1 h-fit w-[52px]",
        stickyBottom && "fixed left-4 top-[42%] -translate-y-1/2 z-50",
        className,
      )}
    >
      {navItems.map((item, idx) => {
        const Icon = item.icon
        const isActive = activeIndex === idx

        return (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex items-center justify-center rounded-full transition-colors duration-200 relative w-10 h-10",
              isActive
                ? "bg-amber-500 text-black shadow-sm"
                : "bg-transparent text-[#F5F0E8]/40 hover:text-[#F5F0E8] hover:bg-white/[0.05]",
              "focus:outline-none focus-visible:ring-0",
            )}
            onClick={() => {
              setActiveIndex(idx)
              navigate(item.path)
            }}
            aria-label={item.label}
            type="button"
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 2}
              aria-hidden
              className="transition-colors duration-200 flex-shrink-0"
            />

          </motion.button>
        )
      })}
    </motion.nav>
  )
}
