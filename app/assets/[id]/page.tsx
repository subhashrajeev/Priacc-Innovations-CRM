'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ArrowLeft, Package, Calendar, DollarSign } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Asset {
  id: string
  assetCode: string
  name: string
  type: string
  status: string
  brand: string
  model: string
  serialNumber: string
  specifications: string
  purchaseDate: string
  purchasePrice: number
  vendor: string
  warrantyExpiry: string
  condition: string
  currentValue: number
  allocations: {
    id: string
    allocatedDate: string
    returnDate: string | null
    condition: string
    employee: {
      firstName: string
      lastName: string
      employeeCode: string
      department: {
        name: string
      }
    }
  }[]
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ALLOCATED: 'bg-blue-100 text-blue-800',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
}

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAssetDetails()
  }, [params.id])

  const fetchAssetDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/assets/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setAsset(data.data)
      } else {
        toast.error('Failed to fetch asset details')
      }
    } catch (error) {
      toast.error('Failed to fetch asset details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Asset not found</div>
      </div>
    )
  }

  const currentAllocation = asset.allocations.find((a) => !a.returnDate)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <Badge className={statusColors[asset.status]}>{asset.status}</Badge>
          </div>
          <p className="text-muted-foreground">{asset.assetCode}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-sm">{asset.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Brand</p>
                  <p className="text-sm">{asset.brand || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Model</p>
                  <p className="text-sm">{asset.model || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                  <p className="text-sm">{asset.serialNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Condition</p>
                  <p className="text-sm">{asset.condition || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
                  <p className="text-sm">
                    {asset.purchaseDate ? formatDate(asset.purchaseDate) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purchase Price</p>
                  <p className="text-sm">
                    {asset.purchasePrice
                      ? `₹${asset.purchasePrice.toLocaleString()}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                  <p className="text-sm">
                    {asset.currentValue ? `₹${asset.currentValue.toLocaleString()}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                  <p className="text-sm">{asset.vendor || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warranty Expiry</p>
                  <p className="text-sm">
                    {asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : '-'}
                  </p>
                </div>
              </div>

              {asset.specifications && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Specifications
                    </p>
                    <p className="text-sm">{asset.specifications}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocation History</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.allocations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No allocation history
                </p>
              ) : (
                <div className="space-y-4">
                  {asset.allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {allocation.employee.firstName} {allocation.employee.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {allocation.employee.employeeCode} •{' '}
                          {allocation.employee.department.name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Allocated: </span>
                            {formatDate(allocation.allocatedDate)}
                          </div>
                          {allocation.returnDate && (
                            <div>
                              <span className="text-muted-foreground">Returned: </span>
                              {formatDate(allocation.returnDate)}
                            </div>
                          )}
                        </div>
                      </div>
                      {!allocation.returnDate && (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {currentAllocation && (
            <Card>
              <CardHeader>
                <CardTitle>Current Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Allocated To</p>
                    <p className="text-sm text-muted-foreground">
                      {currentAllocation.employee.firstName}{' '}
                      {currentAllocation.employee.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Employee Code</p>
                    <p className="text-sm text-muted-foreground">
                      {currentAllocation.employee.employeeCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">
                      {currentAllocation.employee.department.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Since</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(currentAllocation.allocatedDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
