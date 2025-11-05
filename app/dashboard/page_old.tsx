"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Calendar as CalendarIcon, List } from "lucide-react"

import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { EventCard } from "@/components/event-card"
import { Calendar } from "@/components/calendar"
import { useAuth } from "@/context/auth-context"
import { apiService, type Event } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    start_time: "",
    end_time: "",
    description: "",
    status: "BUSY" as Event['status']
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const eventsData = await apiService.getEvents()
      setEvents(eventsData)
    } catch (error) {
      console.error("Failed to load events:", error)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEvent = async () => {
    try {
      // Validate required fields
      if (!newEvent.title || !newEvent.start_time || !newEvent.end_time) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      // Validate time
      if (new Date(newEvent.start_time) >= new Date(newEvent.end_time)) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive"
        })
        return
      }

      await apiService.createEvent(newEvent)
      await loadEvents()
      setIsAddingEvent(false)
      setNewEvent({
        title: "",
        start_time: "",
        end_time: "",
        description: "",
        status: "BUSY"
      })
      toast({
        title: "Success",
        description: "Event created successfully"
      })
    } catch (error) {
      console.error("Failed to create event:", error)
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      })
    }
  }

  const handleMakeSwappable = async (id: number) => {
    try {
      await apiService.updateEvent(id, { status: "SWAPPABLE" })
      await loadEvents()
      toast({
        title: "Success",
        description: "Event marked as swappable"
      })
    } catch (error) {
      console.error("Failed to update event:", error)
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      })
    }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      await apiService.deleteEvent(id)
      await loadEvents()
      toast({
        title: "Success",
        description: "Event deleted successfully"
      })
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      })
    }
  }

  const handleEditEvent = (id: number) => {
    // For now, just show a toast - you can implement edit modal later
    toast({
      title: "Edit Event",
      description: "Edit functionality coming soon!"
    })
  }

  const handleCalendarAddEvent = (date: Date) => {
    const startTime = new Date(date)
    startTime.setHours(9, 0, 0, 0) // Default to 9 AM
    const endTime = new Date(date)
    endTime.setHours(10, 0, 0, 0) // Default to 10 AM

    setNewEvent({
      ...newEvent,
      start_time: startTime.toISOString().slice(0, 16),
      end_time: endTime.toISOString().slice(0, 16)
    })
    setIsAddingEvent(true)
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your time slots and swap opportunities
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex rounded-lg border">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="rounded-l-none"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                </div>

                {/* Add Event Dialog */}
                <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                          placeholder="Event title"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start_time">Start Time *</Label>
                          <Input
                            id="start_time"
                            type="datetime-local"
                            value={newEvent.start_time}
                            onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_time">End Time *</Label>
                          <Input
                            id="end_time"
                            type="datetime-local"
                            value={newEvent.end_time}
                            onChange={(e) => setNewEvent({...newEvent, end_time: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={newEvent.status} onValueChange={(value: Event['status']) => setNewEvent({...newEvent, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BUSY">Busy</SelectItem>
                            <SelectItem value="SWAPPABLE">Swappable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                          placeholder="Optional description"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleAddEvent} className="flex-1">
                          Create Event
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddingEvent(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl border border-primary/20"
              >
                <h3 className="text-2xl font-bold text-primary">{events.length}</h3>
                <p className="text-muted-foreground">Total Events</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 rounded-xl border border-green-500/20"
              >
                <h3 className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.status === "SWAPPABLE").length}
                </h3>
                <p className="text-muted-foreground">Swappable Slots</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-6 rounded-xl border border-yellow-500/20"
              >
                <h3 className="text-2xl font-bold text-yellow-600">
                  {events.filter(e => e.status === "SWAP_PENDING").length}
                </h3>
                <p className="text-muted-foreground">Pending Swaps</p>
              </motion.div>
            </div>

            {/* Events Display */}
            {viewMode === 'calendar' ? (
              <Calendar 
                events={events}
                onEventClick={handleEditEvent}
                onAddEvent={handleCalendarAddEvent}
              />
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Events</h2>
                {events.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/20"
                  >
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first event to get started with swapping</p>
                    <Button onClick={() => setIsAddingEvent(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onMakeSwappable={handleMakeSwappable}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
        endTime: "4:00 PM",
        status: "BUSY",
      },
      {
        id: "3",
        title: "Lunch Break",
        startTime: "12:00 PM",
        endTime: "1:00 PM",
        status: "SWAPPABLE",
      },
    ])
  }, [])

  const handleMakeSwappable = (id: string) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, status: "SWAPPABLE" as const } : e)))
  }

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (newEvent.title && newEvent.startTime && newEvent.endTime) {
      setEvents([
        ...events,
        {
          id: Math.random().toString(36).substr(2, 9),
          ...newEvent,
          status: "BUSY",
        },
      ])
      setNewEvent({ title: "", startTime: "", endTime: "" })
      setIsAddingEvent(false)
    }
  }

  const handleDelete = (id: string) => {
    setEvents(events.filter((e) => e.id !== id))
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/10 relative overflow-hidden">
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
              Welcome back, {user?.name}
            </h1>
            <p className="text-muted-foreground text-xl">Manage your time slots and find exchange opportunities</p>
          </motion.div>

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
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
                    />
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="px-4 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none transition-colors"
                    />
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
                className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-6 border border-border sticky top-24 shadow-sm hover:shadow-md transition-shadow"
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
