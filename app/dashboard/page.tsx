"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { EventCard, type Event } from "@/components/event-card"
import { useAuth } from "@/context/auth-context"
import { useEvents } from "@/hooks/use-api"
import { useState } from "react"
import { motion } from "framer-motion"

// Convert API event to component event
const convertApiEventToEvent = (apiEvent: any): Event => {
  // Ensure status is valid, default to BUSY if undefined or invalid
  const validStatuses = ['BUSY', 'SWAPPABLE', 'SWAP_PENDING'] as const
  const status = validStatuses.includes(apiEvent.status) ? apiEvent.status : 'BUSY'
  
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

export default function DashboardPage() {
  const { user } = useAuth()
  const { events: apiEvents, isLoading, error, createEvent, updateEvent, deleteEvent } = useEvents()
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({ 
    title: "", 
    startTime: "", 
    endTime: "",
    description: "",
    date: ""
  })

  // Convert API events to component events
  const events = apiEvents.map(convertApiEventToEvent)

  const handleMakeSwappable = async (id: string) => {
    try {
      await updateEvent(parseInt(id), { status: "SWAPPABLE" })
      alert('Event made swappable successfully!')
    } catch (error) {
      console.error('Failed to make event swappable:', error)
      let errorMessage = 'Failed to make event swappable. Please try again.'
      
      // Better error message handling
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      alert(errorMessage)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newEvent.title && newEvent.startTime && newEvent.endTime) {
      try {
        // Ensure time format is correct (HH:MM)
        const formatTime = (time: string) => {
          // If just a number like "6", convert to "06:00"
          if (/^\d{1,2}$/.test(time)) {
            const hour = parseInt(time)
            return `${hour.toString().padStart(2, '0')}:00`
          }
          // If format like "6:30", convert to "06:30"
          if (/^\d{1,2}:\d{2}$/.test(time)) {
            const [hour, minute] = time.split(':')
            return `${hour.padStart(2, '0')}:${minute}`
          }
          return time // Already in correct format
        }

        const formattedStartTime = formatTime(newEvent.startTime)
        const formattedEndTime = formatTime(newEvent.endTime)
        
        console.log('Creating event with times:', {
          original: { start: newEvent.startTime, end: newEvent.endTime },
          formatted: { start: formattedStartTime, end: formattedEndTime }
        })
        
        // Create proper datetime strings from time inputs using selected date or today
        const eventDate = newEvent.date ? new Date(newEvent.date) : new Date()
        const year = eventDate.getFullYear()
        const month = String(eventDate.getMonth() + 1).padStart(2, '0')
        const day = String(eventDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        // Create Date objects for start and end times
        const startDateTime = new Date(`${dateStr}T${formattedStartTime}:00`)
        const endDateTime = new Date(`${dateStr}T${formattedEndTime}:00`)
        
        console.log('Final datetime objects:', {
          start: startDateTime.toString(),
          end: endDateTime.toString(),
          startISO: startDateTime.toISOString(),
          endISO: endDateTime.toISOString()
        })
        
        await createEvent({
          title: newEvent.title,
          description: newEvent.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: "BUSY"
        })
        
        setNewEvent({ title: "", startTime: "", endTime: "", description: "", date: "" })
        setIsAddingEvent(false)
      } catch (error) {
        console.error('Failed to create event:', error)
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(parseInt(id))
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-linear-to-br from-background via-background to-card/10 relative overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your calendar...</p>
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
              Welcome back, {user?.first_name || user?.email?.split('@')[0]}
            </h1>
            <p className="text-muted-foreground text-xl">Manage your time slots and find exchange opportunities</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive"
            >
              {error}
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-foreground">Your Calendar</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsAddingEvent(!isAddingEvent)}
                  className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-3xl shadow-xl hover:shadow-2xl hover:shadow-primary/25 transition-elegant animate-subtle-glow"
                >
                  +
                </motion.button>
              </div>

              {isAddingEvent && (
                <motion.form
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  onSubmit={handleAddEvent}
                  className="bg-card p-6 rounded-xl border border-primary/20 mb-6 space-y-4"
                >
                  <input
                    type="text"
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
                  />
                  <textarea
                    placeholder="Event description (optional)"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
                    rows={2}
                  />
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    />
                    {!newEvent.date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty to use today's date
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Start Time</label>
                      <input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">End Time</label>
                      <input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Add Event
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setIsAddingEvent(false)}
                      className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.form>
              )}

              <motion.div className="space-y-4">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <EventCard event={event} onMakeSwappable={handleMakeSwappable} onDelete={handleDelete} />
                  </motion.div>
                ))}
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
                <h3 className="font-bold text-lg mb-4 text-foreground">Quick Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Events</p>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl font-bold text-primary"
                    >
                      {events.length}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Available to Swap</p>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15 }}
                      className="text-3xl font-bold text-accent"
                    >
                      {events.filter((e) => e.status === "SWAPPABLE").length}
                    </motion.p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending Swaps</p>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl font-bold text-secondary"
                    >
                      {events.filter((e) => e.status === "SWAP_PENDING").length}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
