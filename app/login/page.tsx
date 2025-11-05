"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LoginPage() {
  const { login, isLoading, isAuthenticated, error: authError, clearError } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [focusedField, setFocusedField] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (authError) {
      setError(authError)
      clearError()
    }
  }, [authError, clearError])

  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      // Error is handled by the context
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center"
          >
            <span className="text-3xl">⚡</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SlotSwapper</h1>
          <p className="text-muted-foreground">Exchange time slots effortlessly</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 bg-card ${
                focusedField === "email"
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-border hover:border-border/50"
              }`}
              placeholder="you@example.com"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 bg-card ${
                focusedField === "password"
                  ? "border-secondary shadow-lg shadow-secondary/20"
                  : "border-border hover:border-border/50"
              }`}
              placeholder="••••••••"
            />
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                <span>Logging in...</span>
              </span>
            ) : (
              "Login"
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
