"use client"

import { motion } from "framer-motion"
import { useState } from "react"

export interface Event {
  id: string
  title: string
  startTime: string
  endTime: string
  status: "BUSY" | "SWAPPABLE" | "SWAP_PENDING"
  userName?: string
  userAvatar?: string
}

interface EventCardProps {
  event: Event
  onMakeSwappable?: (id: string) => void
  onRequestSwap?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  isMarketplace?: boolean
  showSwapButton?: boolean
  disabled?: boolean
}

export function EventCard({
  event,
  onMakeSwappable,
  onRequestSwap,
  onEdit,
  onDelete,
  isMarketplace = false,
  showSwapButton = false,
  disabled = false,
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const statusConfig = {
    BUSY: { bg: "bg-muted", text: "text-muted-foreground", label: "Busy" },
    SWAPPABLE: { bg: "bg-accent/20", text: "text-accent", label: "Available to Swap" },
    SWAP_PENDING: { bg: "bg-primary/20", text: "text-primary", label: "Swap Pending" },
  }

  const config = statusConfig[event.status]
  
  // Debug logging for undefined config
  if (!config) {
    console.error('EventCard: Invalid status received:', event.status, 'for event:', event)
  }
  
  const safeConfig = config || { bg: "bg-muted", text: "text-muted-foreground", label: "Unknown" }

  // Get time period for marketplace display
  const getTimePeriod = (startTime: string) => {
    const hour = new Date(`2000-01-01 ${startTime}`).getHours()
    if (hour >= 6 && hour < 12) return { label: 'Morning', icon: '🌅', color: 'text-orange-500' }
    if (hour >= 12 && hour < 17) return { label: 'Afternoon', icon: '☀️', color: 'text-yellow-500' }
    if (hour >= 17 && hour < 22) return { label: 'Evening', icon: '🌆', color: 'text-purple-500' }
    return { label: 'Night', icon: '🌙', color: 'text-blue-500' }
  }

  const timePeriod = isMarketplace ? getTimePeriod(event.startTime) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative overflow-hidden group"
    >
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-primary/5 to-secondary/5 opacity-0"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className={`relative p-5 rounded-xl border transition-all duration-300 ${
          isHovered ? "shadow-lg shadow-primary/20 border-primary/40 bg-card" : "bg-card border-border shadow-sm"
        }`}
        animate={{
          y: isHovered ? -4 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground text-lg">{event.title}</h3>
              {timePeriod && (
                <motion.span
                  animate={{ scale: isHovered ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                  className={`text-sm ${timePeriod.color} flex items-center gap-1`}
                  title={`${timePeriod.label} slot`}
                >
                  <span>{timePeriod.icon}</span>
                  <span className="font-medium">{timePeriod.label}</span>
                </motion.span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {event.startTime} - {event.endTime}
            </p>
          </div>
          <motion.span
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.2 }}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${safeConfig.bg} ${safeConfig.text} ml-3`}
          >
            {safeConfig.label}
          </motion.span>
        </div>

        {isMarketplace && event.userName && (
          <div className="flex items-center space-x-2 mb-4 pb-4 border-t border-border/50">
            <img src={event.userAvatar || "/placeholder.svg"} alt={event.userName} className="w-8 h-8 rounded-full" />
            <span className="text-sm text-muted-foreground">{event.userName}</span>
          </div>
        )}

        <div className="flex gap-2">
          {!isMarketplace && event.status === "BUSY" && onMakeSwappable && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onMakeSwappable(event.id)}
              className="flex-1 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium text-sm transition-colors duration-200"
            >
              Make Swappable
            </motion.button>
          )}

          {!isMarketplace && event.status !== "BUSY" && onEdit && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onEdit(event.id)}
              className="flex-1 px-4 py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 font-medium text-sm transition-colors duration-200"
            >
              Edit
            </motion.button>
          )}

          {!isMarketplace && onDelete && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onDelete(event.id)}
              className="flex-1 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium text-sm transition-colors duration-200"
            >
              Delete
            </motion.button>
          )}

          {(showSwapButton || isMarketplace) && onRequestSwap && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onRequestSwap(event.id)}
              className="flex-1 px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 font-medium text-sm transition-colors duration-200"
            >
              Request Swap
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
