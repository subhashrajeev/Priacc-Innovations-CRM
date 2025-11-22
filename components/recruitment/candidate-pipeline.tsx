'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Application {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  totalExperience?: number
  expectedCTC?: number
}

interface CandidatePipelineProps {
  applications: Application[]
  jobId: string
  onStatusChange?: () => void
}

export function CandidatePipeline({ applications, jobId, onStatusChange }: CandidatePipelineProps) {
  const stages = [
    { id: 'APPLIED', label: 'Applied', color: 'bg-gray-100' },
    { id: 'SCREENING', label: 'Screening', color: 'bg-blue-100' },
    { id: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-purple-100' },
    { id: 'INTERVIEW_SCHEDULED', label: 'Interview', color: 'bg-indigo-100' },
    { id: 'OFFERED', label: 'Offered', color: 'bg-green-100' },
    { id: 'ACCEPTED', label: 'Accepted', color: 'bg-emerald-100' },
  ]

  const moveCandidate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/recruitment/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Candidate moved successfully')
        if (onStatusChange) onStatusChange()
      } else {
        toast.error(data.error || 'Failed to move candidate')
      }
    } catch (error) {
      toast.error('Failed to move candidate')
    }
  }

  const getCandidatesByStage = (stageId: string) => {
    return applications.filter(app => app.status === stageId)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-6">
        {stages.map((stage) => {
          const candidates = getCandidatesByStage(stage.id)

          return (
            <Card key={stage.id} className={`${stage.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {stage.label}
                  <Badge variant="secondary">{candidates.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidates.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No candidates
                  </p>
                ) : (
                  candidates.map((candidate) => (
                    <Card key={candidate.id} className="bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2">
                        <div>
                          <h4 className="font-semibold text-sm">
                            {candidate.firstName} {candidate.lastName}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {candidate.email}
                          </p>
                        </div>

                        {candidate.totalExperience && (
                          <p className="text-xs text-muted-foreground">
                            {candidate.totalExperience} yrs exp
                          </p>
                        )}

                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            asChild
                          >
                            <Link href={`/recruitment/applications/${candidate.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                        </div>

                        {/* Quick move actions */}
                        <div className="flex gap-1">
                          {stage.id !== 'ACCEPTED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs flex-1"
                              onClick={() => {
                                const currentIndex = stages.findIndex(s => s.id === stage.id)
                                if (currentIndex < stages.length - 1) {
                                  moveCandidate(candidate.id, stages[currentIndex + 1].id)
                                }
                              }}
                            >
                              →
                            </Button>
                          )}
                          {stage.id !== 'APPLIED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs flex-1"
                              onClick={() => moveCandidate(candidate.id, 'REJECTED')}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Rejected Section */}
      <Card className="bg-red-50 border-2 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Rejected
            <Badge variant="secondary">
              {applications.filter(app => app.status === 'REJECTED').length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.filter(app => app.status === 'REJECTED').length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No rejected candidates
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-4">
              {applications
                .filter(app => app.status === 'REJECTED')
                .map((candidate) => (
                  <div key={candidate.id} className="text-xs p-2 bg-white rounded border">
                    <p className="font-medium truncate">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    <p className="text-muted-foreground truncate">{candidate.email}</p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
