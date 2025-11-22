'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Send, Inbox } from 'lucide-react'
import { toast } from 'sonner'

export default function FeedbackPage() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    recipientId: '',
    feedbackType: 'POSITIVE',
    category: '',
    message: '',
    anonymous: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement feedback submission API
    toast.success('Feedback sent successfully')
    setOpen(false)
    setFormData({
      recipientId: '',
      feedbackType: 'POSITIVE',
      category: '',
      message: '',
      anonymous: false,
    })
  }

  // Mock data - replace with actual API calls
  const receivedFeedback = [
    {
      id: '1',
      from: 'John Doe',
      type: 'POSITIVE',
      category: 'Teamwork',
      message: 'Great collaboration on the recent project. Your communication skills really helped the team stay aligned.',
      date: '2025-11-20',
      anonymous: false,
    },
    {
      id: '2',
      from: 'Anonymous',
      type: 'CONSTRUCTIVE',
      category: 'Technical Skills',
      message: 'Consider documenting your code more thoroughly for better maintainability.',
      date: '2025-11-18',
      anonymous: true,
    },
  ]

  const givenFeedback = [
    {
      id: '3',
      to: 'Jane Smith',
      type: 'POSITIVE',
      category: 'Leadership',
      message: 'Excellent mentoring of new team members.',
      date: '2025-11-19',
    },
  ]

  const FeedbackCard = ({ feedback, type }: { feedback: any; type: 'received' | 'given' }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {type === 'received'
                ? feedback.anonymous
                  ? 'Anonymous'
                  : `From: ${feedback.from}`
                : `To: ${feedback.to}`}
            </CardTitle>
            <CardDescription>{feedback.date}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                feedback.type === 'POSITIVE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {feedback.type}
            </span>
            {feedback.category && (
              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {feedback.category}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{feedback.message}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">360° Feedback</h1>
          <p className="text-muted-foreground">Give and receive continuous feedback</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Give Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Give Feedback</DialogTitle>
                <DialogDescription>
                  Provide constructive feedback to help your colleagues grow
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient *</Label>
                  <Select
                    value={formData.recipientId}
                    onValueChange={(value) => setFormData({ ...formData, recipientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Doe</SelectItem>
                      <SelectItem value="2">Jane Smith</SelectItem>
                      <SelectItem value="3">Bob Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.feedbackType}
                      onValueChange={(value) => setFormData({ ...formData, feedbackType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POSITIVE">Positive</SelectItem>
                        <SelectItem value="CONSTRUCTIVE">Constructive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Teamwork"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    placeholder="Share your feedback..."
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={formData.anonymous}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, anonymous: checked as boolean })
                    }
                  />
                  <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                    Send anonymously
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send Feedback</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList>
          <TabsTrigger value="received">
            <Inbox className="mr-2 h-4 w-4" />
            Received ({receivedFeedback.length})
          </TabsTrigger>
          <TabsTrigger value="given">
            <Send className="mr-2 h-4 w-4" />
            Given ({givenFeedback.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedFeedback.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No feedback received yet</h3>
                <p className="text-sm text-muted-foreground">
                  Feedback from colleagues will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedFeedback.map((feedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} type="received" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="given" className="space-y-4">
          {givenFeedback.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No feedback given yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start giving feedback to your colleagues
                </p>
                <Button onClick={() => setOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Give Feedback
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {givenFeedback.map((feedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} type="given" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
