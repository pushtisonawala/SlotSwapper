"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      router.push(isAuthenticated ? "/dashboard" : "/login")
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-card/20 to-background">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary/20"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary border-t-transparent absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
