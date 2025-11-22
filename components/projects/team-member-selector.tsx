'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronsUpDown, X } from 'lucide-react'

interface TeamMemberSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function TeamMemberSelector({ value, onChange }: TeamMemberSelectorProps) {
  const [open, setOpen] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employees?limit=100')
      const result = await response.json()

      if (result.success) {
        setEmployees(result.data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedEmployees = employees.filter((emp) => value.includes(emp.id))

  const toggleEmployee = (employeeId: string) => {
    if (value.includes(employeeId)) {
      onChange(value.filter((id) => id !== employeeId))
    } else {
      onChange([...value, employeeId])
    }
  }

  const removeEmployee = (employeeId: string) => {
    onChange(value.filter((id) => id !== employeeId))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span>
              {value.length > 0
                ? `${value.length} member${value.length !== 1 ? 's' : ''} selected`
                : 'Select team members...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search employees..." />
            <CommandEmpty>
              {isLoading ? 'Loading employees...' : 'No employee found.'}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={`${employee.firstName} ${employee.lastName}`}
                  onSelect={() => toggleEmployee(employee.id)}
                >
                  <Checkbox
                    checked={value.includes(employee.id)}
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.employeeCode}
                      {employee.designation && ` • ${employee.designation.title}`}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEmployees.map((employee) => (
            <Badge key={employee.id} variant="secondary" className="pl-2 pr-1">
              {employee.firstName} {employee.lastName}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-2 hover:bg-transparent"
                onClick={() => removeEmployee(employee.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
