"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { useSwapRequests } from "@/hooks/use-api"
import { motion } from "framer-motion"

export default function RequestsPage() {
  const { 
    incomingRequests, 
    isLoading, 
    error, 
    respondToSwapRequest 
  } = useSwapRequests()

  // Fallback sample requests for when API fails
  const fallbackIncomingRequests = [
    {
      id: "fallback-1",
      status: "PENDING",
      requester_name: "Sarah Johnson",
      offering_event_title: "Marketing Strategy Review",
      offering_event_start: "2025-11-06T14:00:00Z",
      target_event_title: "Client Presentation", 
      target_event_start: "2025-11-06T10:00:00Z",
      created_at: "2025-11-05T10:00:00Z"
    },
    {
      id: "fallback-2",
      status: "PENDING", 
      requester_name: "Mike Chen",
      offering_event_title: "Available Time Block",
      offering_event_start: "2025-11-07T09:00:00Z",
      target_event_title: "Team Standup",
      target_event_start: "2025-11-07T15:00:00Z", 
      created_at: "2025-11-05T09:30:00Z"
    }
  ]

  // Use fallback data if there's an error
  const displayIncomingRequests = error ? fallbackIncomingRequests : incomingRequests

  const handleAccept = async (requestId: number) => {
    if (error) {
      return
    }
    
    try {
      await respondToSwapRequest(requestId, true)
      console.log("Swap request accepted! Calendars have been updated.")
    } catch (error) {
      console.error('Failed to accept swap request:', error)
    }
  }

  const handleReject = async (requestId: number) => {
    if (error) {
      return
    }
    
    try {
      await respondToSwapRequest(requestId, false)
      console.log("Swap request rejected.")
    } catch (error) {
      console.error('Failed to reject swap request:', error)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-linear-to-br from-background via-background to-card/10 relative overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading swap requests...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-background via-background to-card/10 relative overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-gentle-float"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-secondary/3 rounded-full blur-3xl animate-gentle-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-12 text-center lg:text-left"
          >
            <h1 className="text-5xl font-bold text-foreground mb-4 text-glow">
              Incoming Requests
            </h1>
            <p className="text-muted-foreground text-xl">
              Manage incoming time slot exchange requests from other users
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg text-amber-800 dark:text-amber-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                <div>
                  <p className="font-medium">Showing sample data</p>
                  <p className="text-sm opacity-90">
                    We're having trouble connecting to our servers. The requests below are sample data to show you how the requests page works.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="max-w-4xl mx-auto">
            {/* Incoming Requests */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Pending Requests</h2>
              <div className="space-y-4">
                {displayIncomingRequests
                  .filter((request: any) => request.status === "PENDING")
                  .map((request: any, index: number) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {request.requester_name} wants to swap
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAccept(request.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          >
                            Accept
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleReject(request.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                          >
                            Reject
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground mb-2">They offer:</h4>
                          <p className="text-foreground font-medium">{request.offering_event_title}</p>
                          <p className="text-muted-foreground text-sm">
                            {new Date(request.offering_event_start).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground mb-2">For your:</h4>
                          <p className="text-foreground font-medium">{request.target_event_title}</p>
                          <p className="text-muted-foreground text-sm">
                            {new Date(request.target_event_start).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                
                {displayIncomingRequests.filter((request: any) => request.status === "PENDING").length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="text-6xl mb-4">📥</div>
                    <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                      No pending requests
                    </h3>
                    <p className="text-muted-foreground">
                      You'll see incoming swap requests here when other users want to exchange time slots with you.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}