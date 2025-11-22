'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AssetAllocation {
  id: string
  allocatedDate: string
  returnDate: string | null
  expectedReturnDate: string | null
  condition: string
  asset: {
    id: string
    assetCode: string
    name: string
    type: string
    brand: string
    model: string
    serialNumber: string
  }
}

export default function MyAssetsPage() {
  const router = useRouter()
  const [allocations, setAllocations] = useState<AssetAllocation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMyAssets()
  }, [])

  const fetchMyAssets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/assets/my-assets')
      if (response.ok) {
        const data = await response.json()
        setAllocations(data.data || [])
      } else {
        toast.error('Failed to fetch assets')
      }
    } catch (error) {
      toast.error('Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }

  const activeAllocations = allocations.filter((a) => !a.returnDate)
  const returnedAllocations = allocations.filter((a) => a.returnDate)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/assets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">My Assets</h1>
          <p className="text-muted-foreground">View your allocated assets</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Allocations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAllocations.length}</div>
            <p className="text-xs text-muted-foreground">Currently assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total History</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocations.length}</div>
            <p className="text-xs text-muted-foreground">All time allocations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currently Allocated Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Brand/Model</TableHead>
                <TableHead>Allocated On</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : activeAllocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No active allocations
                  </TableCell>
                </TableRow>
              ) : (
                activeAllocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell className="font-medium">
                      {allocation.asset.assetCode}
                    </TableCell>
                    <TableCell>{allocation.asset.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{allocation.asset.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {allocation.asset.brand} {allocation.asset.model}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(allocation.allocatedDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{allocation.condition || 'Good'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/assets/${allocation.asset.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {returnedAllocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Returned Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Returned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnedAllocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell className="font-medium">
                      {allocation.asset.assetCode}
                    </TableCell>
                    <TableCell>{allocation.asset.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{allocation.asset.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(allocation.allocatedDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(allocation.returnDate!)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
