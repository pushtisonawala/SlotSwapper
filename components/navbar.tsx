"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Requests", href: "/requests" },
  ]

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-elegant group"
            onClick={() => router.push("/dashboard")}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-elegant"
            >
              <span className="text-white font-bold text-xl">⚡</span>
            </motion.div>
            <span className="font-bold text-xl text-foreground text-glow">SlotSwapper</span>
          </motion.div>

          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <motion.button
                  key={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(item.href)}
                  whileHover={{ y: -2, scale: 1.05 }}
                  className={`px-6 py-3 rounded-xl font-medium transition-elegant relative overflow-hidden ${
                    isActive 
                      ? "text-primary bg-primary/10 shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-highlight"
                      className="absolute inset-0 bg-linear-to-r from-primary/10 to-secondary/10 rounded-xl"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3 glass rounded-full px-4 py-2"
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium hidden sm:inline text-foreground">
                  {user.first_name} {user.last_name}
                </span>
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-primary/10 to-secondary/10 text-primary hover:from-primary/20 hover:to-secondary/20 font-medium transition-elegant border border-primary/20 hover:border-primary/30"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  )
}
