"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SignupPage() {
  const { signup, isLoading, isAuthenticated, error: authError, clearError } = useAuth()
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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

    if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    try {
      await signup(email, password, firstName, lastName, username)
      router.push("/dashboard")
    } catch (err) {
      // Error is handled by the context and will be displayed
      console.error('Signup error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-accent/5 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-secondary to-accent rounded-2xl flex items-center justify-center"
          >
            <span className="text-3xl">⚡</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Join SlotSwapper</h1>
          <p className="text-muted-foreground">Start swapping time slots today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onFocus={() => setFocusedField("firstName")}
                onBlur={() => setFocusedField("")}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 bg-card ${
                  focusedField === "firstName"
                    ? "border-accent shadow-lg shadow-accent/20"
                    : "border-border hover:border-border/50"
                }`}
                placeholder="John"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onFocus={() => setFocusedField("lastName")}
                onBlur={() => setFocusedField("")}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 bg-card ${
                  focusedField === "lastName"
                    ? "border-accent shadow-lg shadow-accent/20"
                    : "border-border hover:border-border/50"
                }`}
                placeholder="Doe"
              />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <label className="block text-sm font-medium text-foreground mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField("")}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 bg-card ${
                focusedField === "username"
                  ? "border-accent shadow-lg shadow-accent/20"
                  : "border-border hover:border-border/50"
              }`}
              placeholder="johndoe"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
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
              placeholder="john@example.com"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
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

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField("")}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 bg-card ${
                focusedField === "confirmPassword"
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
            className="w-full py-3 bg-linear-to-r from-secondary to-accent text-secondary-foreground font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-secondary/30 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary-foreground border-t-transparent"></div>
                <span>Creating account...</span>
              </span>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-secondary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}