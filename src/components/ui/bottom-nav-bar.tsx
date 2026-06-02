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
        "bg-[#0d0c0e] border border-[#1e1c1f] rounded-full flex items-center p-2 shadow-xl space-x-1 min-w-[320px] max-w-[95vw] h-[52px]",
        stickyBottom && "fixed inset-x-0 bottom-6 mx-auto z-50 w-fit",
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
              "flex items-center gap-0 px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[44px]",
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

            <motion.div
              initial={false}
              animate={{
                width: isActive ? `${MOBILE_LABEL_WIDTH}px` : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "8px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.19 },
                marginLeft: { duration: 0.19 },
              }}
              className={cn("overflow-hidden flex items-center text-left")}
            >
              <span
                className={cn(
                  "font-bold text-[11px] uppercase tracking-wider whitespace-nowrap select-none transition-opacity duration-200 overflow-hidden text-ellipsis",
                  isActive ? "text-black" : "opacity-0",
                )}
                title={item.label}
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        )
      })}
    </motion.nav>
  )
}
