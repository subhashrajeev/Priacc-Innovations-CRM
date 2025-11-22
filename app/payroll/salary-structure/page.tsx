'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { calculateCTCBreakdown } from '@/lib/payroll-utils'
import { Loader2, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import SalaryBreakdown from '@/components/payroll/salary-breakdown'

export default function SalaryStructurePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [structures, setStructures] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedStructure, setSelectedStructure] = useState<any>(null)
  const [formData, setFormData] = useState({
    designationId: '',
    name: '',
    minCTC: '',
    maxCTC: '',
  })

  useEffect(() => {
    // Check if user is HR
    if (session?.user?.role && !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'].includes(session.user.role)) {
      router.push('/payroll')
      return
    }

    fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch salary structures
      const structuresRes = await fetch('/api/payroll/salary')
      if (structuresRes.ok) {
        const data = await structuresRes.json()
        setStructures(data.data)
      }

      // Fetch designations (you'll need to create this endpoint)
      // For now, using placeholder
      setDesignations([])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const { minCTC, maxCTC } = formData
      const breakdown = calculateCTCBreakdown(parseFloat(minCTC))

      const response = await fetch('/api/payroll/salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          minCTC: parseFloat(minCTC),
          maxCTC: parseFloat(maxCTC),
          ...breakdown.annual,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create salary structure')
      }

      toast({
        title: 'Success',
        description: 'Salary structure created successfully',
      })

      setShowCreateDialog(false)
      setFormData({ designationId: '', name: '', minCTC: '', maxCTC: '' })
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create salary structure',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salary structure?')) {
      return
    }

    try {
      const response = await fetch(`/api/payroll/salary/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete salary structure')
      }

      toast({
        title: 'Success',
        description: 'Salary structure deleted successfully',
      })

      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete salary structure',
        variant: 'destructive',
      })
    }
  }

  const handleView = (structure: any) => {
    setSelectedStructure(structure)
    setShowViewDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Salary Structures</h1>
          <p className="text-gray-600">
            Manage salary structures for different designations
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Salary Structure</DialogTitle>
              <DialogDescription>
                Define a new salary structure for a designation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Structure Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Senior Developer - Level 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minCTC">Minimum CTC (Annual)</Label>
                  <Input
                    id="minCTC"
                    type="number"
                    value={formData.minCTC}
                    onChange={(e) => setFormData({ ...formData, minCTC: e.target.value })}
                    placeholder="600000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCTC">Maximum CTC (Annual)</Label>
                  <Input
                    id="maxCTC"
                    type="number"
                    value={formData.maxCTC}
                    onChange={(e) => setFormData({ ...formData, maxCTC: e.target.value })}
                    placeholder="800000"
                  />
                </div>
              </div>
              {formData.minCTC && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Preview (Based on Min CTC: {formatCurrency(parseFloat(formData.minCTC))})
                  </p>
                  <div className="text-xs text-blue-700 space-y-1">
                    {(() => {
                      const breakdown = calculateCTCBreakdown(parseFloat(formData.minCTC))
                      return (
                        <>
                          <p>Monthly Gross: {formatCurrency(breakdown.monthly.basic + breakdown.monthly.hra + breakdown.monthly.specialAllowance + breakdown.monthly.conveyance + breakdown.monthly.medicalAllowance)}</p>
                          <p>Basic: {formatCurrency(breakdown.monthly.basic)}</p>
                          <p>HRA: {formatCurrency(breakdown.monthly.hra)}</p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Structure</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Salary Structures</CardTitle>
        </CardHeader>
        <CardContent>
          {structures.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>CTC Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((structure) => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.name}</TableCell>
                    <TableCell>{structure.designation?.title || 'N/A'}</TableCell>
                    <TableCell>
                      {formatCurrency(structure.minCTC)} - {formatCurrency(structure.maxCTC)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={structure.isActive ? 'default' : 'secondary'}>
                        {structure.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(structure)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(structure.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No salary structures found</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Structure
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStructure?.name}</DialogTitle>
            <DialogDescription>
              {selectedStructure?.designation?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedStructure && (
            <SalaryBreakdown
              salary={{
                ctc: selectedStructure.minCTC,
                basicSalary: selectedStructure.basicSalary / 12,
                hra: selectedStructure.hra / 12,
                specialAllowance: selectedStructure.specialAllowance / 12,
                conveyance: selectedStructure.conveyance / 12,
                medicalAllowance: selectedStructure.medicalAllowance / 12,
                otherAllowances: selectedStructure.otherAllowances / 12,
                pf: selectedStructure.pf,
                esi: selectedStructure.esi,
                professionalTax: selectedStructure.professionalTax,
                grossSalary: (selectedStructure.basicSalary + selectedStructure.hra + selectedStructure.specialAllowance + selectedStructure.conveyance + selectedStructure.medicalAllowance) / 12,
                netSalary: ((selectedStructure.basicSalary + selectedStructure.hra + selectedStructure.specialAllowance + selectedStructure.conveyance + selectedStructure.medicalAllowance) / 12) - selectedStructure.pf - selectedStructure.esi - selectedStructure.professionalTax,
              }}
              showChart={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
