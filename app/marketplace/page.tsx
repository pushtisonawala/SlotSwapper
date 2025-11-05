"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { EventCard, type Event } from "@/components/event-card"
import { useSwappableSlots, useSwapRequests, useEvents } from "@/hooks/use-api"
import { useState } from "react"
import { motion } from "framer-motion"

const convertApiEventToEvent = (apiEvent: any): Event => {
  const validStatuses = ['BUSY', 'SWAPPABLE', 'SWAP_PENDING'] as const
  const status = validStatuses.includes(apiEvent.status) ? apiEvent.status : 'SWAPPABLE'
  
  // Parse the UTC time and convert to local time display
  const startDate = new Date(apiEvent.start_time)
  const endDate = new Date(apiEvent.end_time)
  
  return {
    id: apiEvent.id.toString(),
    title: apiEvent.title || 'Untitled Event',
    startTime: startDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true // Use 12-hour format for better readability
    }),
    endTime: endDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    }),
    status: status as Event['status'],
    userName: apiEvent.owner_name,
  }
}

export default function MarketplacePage() {
  const { 
    slots: apiSlots, 
    isLoading: slotsLoading, 
    error: slotsError 
  } = useSwappableSlots()
  
  const { 
    events: userEvents,
    isLoading: eventsLoading 
  } = useEvents()
  
  const { 
    createSwapRequest, 
    isLoading: requestLoading 
  } = useSwapRequests()
  
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [selectedTargetSlot, setSelectedTargetSlot] = useState<string | null>(null)
  const [swapRequestLoading, setSwapRequestLoading] = useState(false)

  const fallbackEvents: Event[] = [
    {
      id: "fallback-1",
      title: "Morning Workout Session",
      startTime: "7:00 AM",
      endTime: "8:00 AM",
      status: "SWAPPABLE",
      userName: "Sample User"
    },
    {
      id: "fallback-2", 
      title: "Team Meeting",
      startTime: "10:30 AM",
      endTime: "11:30 AM",
      status: "SWAPPABLE",
      userName: "Demo Account"
    },
    {
      id: "fallback-3",
      title: "Lunch Break",
      startTime: "1:00 PM", 
      endTime: "2:00 PM",
      status: "SWAPPABLE",
      userName: "Test User"
    },
    {
      id: "fallback-4",
      title: "Project Review",
      startTime: "3:30 PM",
      endTime: "4:30 PM", 
      status: "SWAPPABLE",
      userName: "Sample User"
    },
    {
      id: "fallback-5",
      title: "Study Session",
      startTime: "7:00 PM",
      endTime: "9:00 PM",
      status: "SWAPPABLE", 
      userName: "Demo Account"
    }
  ]

  const availableSlots = slotsError ? fallbackEvents : apiSlots.map(convertApiEventToEvent)

  // Filter slots by time period
  const getTimeCategory = (startTime: string) => {
    const hour = new Date(`2000-01-01 ${startTime}`).getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
  }

  const filteredSlots = selectedFilter === "all" 
    ? availableSlots 
    : availableSlots.filter(slot => getTimeCategory(slot.startTime) === selectedFilter)

  const getSlotsByCategory = () => {
    const categories = {
      morning: availableSlots.filter(slot => getTimeCategory(slot.startTime) === 'morning'),
      afternoon: availableSlots.filter(slot => getTimeCategory(slot.startTime) === 'afternoon'),
      evening: availableSlots.filter(slot => getTimeCategory(slot.startTime) === 'evening'),
      night: availableSlots.filter(slot => getTimeCategory(slot.startTime) === 'night')
    }
    return categories
  }

  const handleRequestSwap = (targetEventId: string) => {
    // If using fallback data, do nothing silently
    if (slotsError) {
      return
    }
    
    setSelectedTargetSlot(targetEventId)
    setShowSwapModal(true)
  }

  const handleConfirmSwap = async (offeringEventId: string) => {
    if (!selectedTargetSlot) return
    
    setSwapRequestLoading(true)
    try {
      console.log('Creating swap request:', {
        offeringEventId,
        selectedTargetSlot,
        offeringEventIdInt: parseInt(offeringEventId),
        selectedTargetSlotInt: parseInt(selectedTargetSlot),
        userEventsCount: userEvents.length,
        selectedEvent: userEvents.find(e => e.id.toString() === offeringEventId),
        availableSlotsCount: availableSlots.length
      })
      
      await createSwapRequest(parseInt(offeringEventId), parseInt(selectedTargetSlot))
      alert("Swap request sent successfully!")
      setShowSwapModal(false)
      setSelectedTargetSlot(null)
    } catch (error) {
      console.error('Swap request failed:', error)
      
      // Log detailed error information for debugging
      if (error instanceof Error) {
        console.log('Error details:', {
          message: error.message,
          type: typeof error,
          errorString: String(error)
        })
        
        if (error.message.includes('not marked as swappable')) {
          console.log("Error: Event not marked as swappable")
        } else if (error.message.includes('not available')) {
          console.log("Error: Target event no longer available")
        } else if (error.message.includes('Event not found') || error.message.includes("don't own")) {
          console.log("Error: Event not found or access denied")
        } else if (error.message.includes('authentication') || error.message.includes('401')) {
          console.log("Error: Authentication required")
        }
      }
    } finally {
      setSwapRequestLoading(false)
    }
  }

  if (slotsLoading || eventsLoading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-linear-to-br from-background via-background to-card/10 relative overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading available slots...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show authentication error specifically
  if (slotsError?.includes('401') || slotsError?.includes('unauthorized') || slotsError?.includes('authentication')) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-linear-to-br from-background via-background to-card/10 relative overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Authentication Required
            </h3>
            <p className="text-muted-foreground mb-4">
              Please log in again to access the marketplace.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Refresh Page
            </button>
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
              Time Slot Marketplace
            </h1>
            <p className="text-muted-foreground text-xl">
              Discover and exchange available time slots with other users
            </p>
          </motion.div>

          {slotsError && (
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
                    We're having trouble connecting to our servers. The events below are sample data to give you an idea of how the marketplace works.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-foreground">Available Slots</h2>
                <div className="flex gap-2">
                  {[
                    { key: "all", label: "All", count: availableSlots.length },
                    { key: "morning", label: "Morning (6AM-12PM)", count: getSlotsByCategory().morning.length },
                    { key: "afternoon", label: "Afternoon (12PM-5PM)", count: getSlotsByCategory().afternoon.length },
                    { key: "evening", label: "Evening (5PM-10PM)", count: getSlotsByCategory().evening.length },
                    { key: "night", label: "Night (10PM-6AM)", count: getSlotsByCategory().night.length }
                  ].map((filter) => (
                    <motion.button
                      key={filter.key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedFilter(filter.key)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors relative ${
                        selectedFilter === filter.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {filter.label}
                      {filter.count > 0 && (
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          selectedFilter === filter.key
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/20 text-primary"
                        }`}>
                          {filter.count}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.div className="grid gap-4">
                {filteredSlots.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="text-6xl mb-4">🕐</div>
                    <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                      {selectedFilter === "all" 
                        ? "No available slots right now"
                        : `No ${selectedFilter} slots available`
                      }
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedFilter === "all" 
                        ? "Check back later for new opportunities to swap time slots!"
                        : `Try selecting a different time period or check back later for ${selectedFilter} slots.`
                      }
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* Show time period summary when a specific filter is selected */}
                    {selectedFilter !== "all" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg"
                      >
                        <h3 className="font-semibold text-primary mb-2">
                          {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Slots ({filteredSlots.length})
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {selectedFilter === "morning" && "Early hours from 6:00 AM to 12:00 PM"}
                          {selectedFilter === "afternoon" && "Midday hours from 12:00 PM to 5:00 PM"}
                          {selectedFilter === "evening" && "Evening hours from 5:00 PM to 10:00 PM"}
                          {selectedFilter === "night" && "Late hours from 10:00 PM to 6:00 AM"}
                        </p>
                      </motion.div>
                    )}
                    
                    {filteredSlots.map((slot, index) => (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                      >
                        <EventCard
                          event={slot}
                          onMakeSwappable={() => {}} // Not applicable for marketplace
                          onDelete={() => {}} // Not applicable for marketplace  
                          showSwapButton={true}
                          onRequestSwap={() => handleRequestSwap(slot.id)}
                          disabled={requestLoading}
                          isMarketplace={true}
                        />
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1"
            >
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-linear-to-br from-accent/10 to-primary/10 rounded-xl p-6 border border-border sticky top-24 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-lg mb-4 text-foreground">Marketplace Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Available Slots</p>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl font-bold text-primary"
                    >
                      {availableSlots.length}
                    </motion.p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "morning", label: "Morning", count: getSlotsByCategory().morning.length, icon: "🌅" },
                      { key: "afternoon", label: "Afternoon", count: getSlotsByCategory().afternoon.length, icon: "☀️" },
                      { key: "evening", label: "Evening", count: getSlotsByCategory().evening.length, icon: "🌆" },
                      { key: "night", label: "Night", count: getSlotsByCategory().night.length, icon: "🌙" }
                    ].map((period, index) => (
                      <motion.div
                        key={period.key}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedFilter === period.key 
                            ? "bg-primary/20 border-primary/40" 
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedFilter(period.key)}
                      >
                        <div className="text-lg mb-1">{period.icon}</div>
                        <p className="text-xs text-muted-foreground">{period.label}</p>
                        <p className="text-lg font-bold text-foreground">{period.count}</p>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Different Users</p>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.35 }}
                      className="text-2xl font-bold text-accent"
                    >
                      {new Set(availableSlots.map(slot => slot.userName)).size}
                    </motion.p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold mb-3 text-foreground">How it works</h4>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold">1.</span>
                      <span>Browse available time slots</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold">2.</span>
                      <span>Request a swap with your own slot</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold">3.</span>
                      <span>Wait for the other user to accept</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold">4.</span>
                      <span>Calendars update automatically!</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border"
          >
            <h3 className="text-xl font-bold text-foreground mb-4">Select Your Event to Offer</h3>
            <p className="text-muted-foreground mb-4">
              Choose one of your swappable events to offer in exchange:
            </p>
            
            {swapRequestLoading && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                <div className="bg-card rounded-lg p-6 flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  <span className="text-foreground font-medium">Sending swap request...</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {userEvents
                .filter(event => event.status === 'SWAPPABLE')
                .map(event => (
                  <motion.button
                    key={event.id}
                    whileHover={{ scale: swapRequestLoading ? 1 : 1.02 }}
                    whileTap={{ scale: swapRequestLoading ? 1 : 0.98 }}
                    onClick={() => handleConfirmSwap(event.id.toString())}
                    className={`w-full text-left p-3 rounded-lg border border-border transition-colors ${
                      swapRequestLoading 
                        ? 'bg-muted/20 cursor-not-allowed opacity-50' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    disabled={swapRequestLoading}
                  >
                    <div className="font-semibold text-foreground">{event.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.start_time).toLocaleString()}
                    </div>
                    <div className="text-xs text-green-400 mt-1">✓ Available to swap</div>
                  </motion.button>
                ))
              }
              
              {userEvents.filter(event => event.status === 'SWAPPABLE').length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>You don't have any swappable events.</p>
                  <p className="text-sm">Go to your dashboard and click "Make Swappable" on your events first!</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: swapRequestLoading ? 1 : 1.02 }}
                whileTap={{ scale: swapRequestLoading ? 1 : 0.98 }}
                onClick={() => {
                  setShowSwapModal(false)
                  setSelectedTargetSlot(null)
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-opacity ${
                  swapRequestLoading 
                    ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed' 
                    : 'bg-muted text-muted-foreground hover:opacity-90'
                }`}
                disabled={swapRequestLoading}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </ProtectedRoute>
  )
}