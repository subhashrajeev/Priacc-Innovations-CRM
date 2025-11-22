'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TaskForm } from './task-form'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const statusColumns = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'REVIEW', label: 'Review', color: 'bg-purple-500' },
  { id: 'COMPLETED', label: 'Completed', color: 'bg-green-500' },
  { id: 'BLOCKED', label: 'Blocked', color: 'bg-red-500' },
]

const priorityColors: Record<string, string> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'default',
  URGENT: 'destructive',
}

interface TaskKanbanProps {
  projectId: string
}

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      const result = await response.json()

      if (result.success) {
        setTasks(result.data)
      } else {
        toast.error('Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('An error occurred while fetching tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleTaskUpdate = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (result.success) {
        fetchTasks()
        toast.success('Task updated successfully')
      } else {
        toast.error(result.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('An error occurred while updating task')
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      handleTaskUpdate(taskId, status)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {tasks.length} Task{tasks.length !== 1 ? 's' : ''}
        </h3>
        <Button onClick={() => {
          setSelectedTask(null)
          setIsFormOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statusColumns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id)

          return (
            <div
              key={column.id}
              className="space-y-2"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${column.color}`} />
                      {column.label}
                    </CardTitle>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[200px]">
                  {columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                          <Badge variant={priorityColors[task.priority]} className="text-xs shrink-0">
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDate(task.dueDate)}
                          </p>
                        )}
                        {task.estimatedHours && (
                          <p className="text-xs text-muted-foreground">
                            Est: {task.estimatedHours}h
                            {task.actualHours && ` / Actual: ${task.actualHours}h`}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      <TaskForm
        projectId={projectId}
        task={selectedTask}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedTask(null)
        }}
        onSuccess={() => {
          fetchTasks()
          setIsFormOpen(false)
          setSelectedTask(null)
        }}
      />
    </div>
  )
}
