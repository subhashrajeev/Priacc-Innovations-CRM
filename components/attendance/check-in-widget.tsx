'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Clock, MapPin, LogIn, LogOut, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Attendance {
  id: string
  checkInTime: string | null
  checkOutTime: string | null
  workHours: number | null
  checkInLocation: string | null
  checkOutLocation: string | null
  status: string
}

export function CheckInWidget() {
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    fetchTodayAttendance()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date()
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      const response = await fetch(`/api/attendance?month=${month}`)

      if (response.ok) {
        const data = await response.json()
        const todayRecord = data.find((record: any) => {
          const recordDate = new Date(record.date)
          return recordDate.toDateString() === today.toDateString()
        })
        setAttendance(todayRecord || null)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const getLocation = (): Promise<{ latitude: number; longitude: number; location: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          // Reverse geocoding to get location name (simplified)
          const location = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

          resolve({ latitude, longitude, location })
        },
        (error) => {
          reject(new Error('Unable to retrieve your location'))
        }
      )
    })
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const { latitude, longitude, location } = await getLocation()

      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          location,
          isRemote: false,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Checked in successfully!')
        setAttendance(data.attendance)
      } else {
        toast.error(data.message || 'Failed to check in')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to check in')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const { latitude, longitude, location } = await getLocation()

      const response = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          location,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Checked out successfully!')
        setAttendance(data.attendance)
      } else {
        toast.error(data.message || 'Failed to check out')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to check out')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getStatus = () => {
    if (!attendance) return { text: 'Not Checked In', color: 'bg-gray-500' }
    if (attendance.checkOutTime) return { text: 'Checked Out', color: 'bg-blue-500' }
    if (attendance.checkInTime) return { text: 'Checked In', color: 'bg-green-500' }
    return { text: 'Not Checked In', color: 'bg-gray-500' }
  }

  const status = getStatus()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today&apos;s Attendance</CardTitle>
          <Badge className={status.color}>{status.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-3xl font-bold">{formatTime(currentTime)}</p>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {attendance && (
          <div className="space-y-2 pt-4 border-t">
            {attendance.checkInTime && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Check In:</span>
                </div>
                <span>{formatDateTime(attendance.checkInTime)}</span>
              </div>
            )}

            {attendance.checkOutTime && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Check Out:</span>
                </div>
                <span>{formatDateTime(attendance.checkOutTime)}</span>
              </div>
            )}

            {attendance.workHours !== null && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Hours Worked:</span>
                </div>
                <span className="font-bold">{attendance.workHours.toFixed(2)} hrs</span>
              </div>
            )}

            {attendance.checkInLocation && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground text-xs">
                  {attendance.checkInLocation}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="pt-4">
          {!attendance?.checkInTime ? (
            <Button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Check In
                </>
              )}
            </Button>
          ) : !attendance?.checkOutTime ? (
            <Button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Check Out
                </>
              )}
            </Button>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                You have completed today&apos;s attendance
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
