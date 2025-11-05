import { useState, useEffect } from 'react'
import { apiService, type Event as ApiEvent, type SwapRequest, type CreateEventRequest } from '@/lib/api/api-service'

// Hook for managing user's events
export function useEvents() {
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiService.getEvents()
      if (response.data) {
        setEvents(response.data)
      } else {
        setError(response.error || 'Failed to fetch events')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setIsLoading(false)
    }
  }

  const createEvent = async (eventData: CreateEventRequest) => {
    try {
      const response = await apiService.createEvent(eventData)
      if (response.data) {
        setEvents(prev => [...prev, response.data!])
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create event')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event'
      setError(errorMessage)
      throw err
    }
  }

  const updateEvent = async (id: number, eventData: Partial<CreateEventRequest>) => {
    try {
      const response = await apiService.updateEvent(id, eventData)
      if (response.data) {
        setEvents(prev => prev.map(event => 
          event.id === id ? response.data! : event
        ))
        return response.data
      } else {
        const errorMessage = response.error || 'Failed to update event'
        throw new Error(errorMessage)
      }
    } catch (err) {
      let errorMessage = 'Failed to update event'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteEvent = async (id: number) => {
    try {
      const response = await apiService.deleteEvent(id)
      if (response.status === 204 || response.status === 200 || response.status === 404) {
        // Even if 404 (not found), remove it from the UI since it's already gone
        setEvents(prev => prev.filter(event => event.id !== id))
      } else {
        throw new Error(response.error || 'Failed to delete event')
      }
    } catch (err) {
      // For delete operations, if the item is already gone, that's fine
      if (err instanceof Error && err.message.includes('Not found')) {
        setEvents(prev => prev.filter(event => event.id !== id))
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event'
      setError(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}

// Hook for managing swappable slots
export function useSwappableSlots() {
  const [slots, setSlots] = useState<ApiEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch first 100 slots to reduce loading time
      const response = await apiService.getSwappableSlots(1, 100)
      if (response.data) {
        setSlots(response.data)
      } else {
        // Return empty array instead of error to allow fallback data
        setSlots([])
        setError(response.error || 'Unable to connect to server')
      }
    } catch (err) {
      console.error('Error fetching swappable slots:', err)
      // Return empty array instead of error to allow fallback data
      setSlots([])
      setError(err instanceof Error ? err.message : 'Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  return {
    slots,
    isLoading,
    error,
    refetch: fetchSlots,
  }
}

// Hook for managing swap requests
export function useSwapRequests() {
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Fetching swap requests...')
      const [incomingResponse, outgoingResponse] = await Promise.all([
        apiService.getIncomingSwapRequests(),
        apiService.getOutgoingSwapRequests(),
      ])

      console.log('Incoming response:', incomingResponse)
      console.log('Outgoing response:', outgoingResponse)

      if (incomingResponse.data) {
        setIncomingRequests(incomingResponse.data)
      } else {
        console.error('Incoming requests error:', incomingResponse.error)
        setIncomingRequests([]) // Use empty array for fallback
      }
      
      if (outgoingResponse.data) {
        setOutgoingRequests(outgoingResponse.data)
      } else {
        console.error('Outgoing requests error:', outgoingResponse.error)
        setOutgoingRequests([]) // Use empty array for fallback
      }

      if (incomingResponse.error && outgoingResponse.error) {
        setError(`Unable to connect to server`)
      } else if (incomingResponse.error) {
        setError(`Failed to fetch incoming requests: ${incomingResponse.error}`)
      } else if (outgoingResponse.error) {
        setError(`Failed to fetch outgoing requests: ${outgoingResponse.error}`)
      }
    } catch (err) {
      console.error('Network error fetching requests:', err)
      // Set empty arrays for fallback
      setIncomingRequests([])
      setOutgoingRequests([])
      setError(err instanceof Error ? err.message : 'Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const createSwapRequest = async (mySlotId: number, theirSlotId: number, message?: string) => {
    try {
      const response = await apiService.createSwapRequest({
        my_slot_id: mySlotId,
        their_slot_id: theirSlotId,
        message,
      })
      
      if (response.data) {
        // Refresh the requests to get the latest state
        await fetchRequests()
        return response.data.swap_request
      } else {
        throw new Error(response.error || 'Failed to create swap request')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create swap request'
      setError(errorMessage)
      throw err
    }
  }

  const respondToSwapRequest = async (requestId: number, accept: boolean) => {
    try {
      const response = await apiService.respondToSwapRequest(requestId, { accept })
      
      if (response.data) {
        // Refresh the requests to get the latest state
        await fetchRequests()
        return response.data.swap_request
      } else {
        throw new Error(response.error || 'Failed to respond to swap request')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to respond to swap request'
      setError(errorMessage)
      throw err
    }
  }

  const cancelSwapRequest = async (requestId: number) => {
    try {
      const response = await apiService.cancelSwapRequest(requestId)
      
      if (response.data) {
        // Refresh the requests to get the latest state
        await fetchRequests()
        return response.data.swap_request
      } else {
        throw new Error(response.error || 'Failed to cancel swap request')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel swap request'
      setError(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  return {
    incomingRequests,
    outgoingRequests,
    isLoading,
    error,
    refetch: fetchRequests,
    createSwapRequest,
    respondToSwapRequest,
    cancelSwapRequest,
  }
}