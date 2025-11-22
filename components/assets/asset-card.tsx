import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Laptop, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AssetCardProps {
  asset: {
    id: string
    assetCode: string
    name: string
    type: string
    status: string
    brand?: string
    model?: string
    serialNumber?: string
    purchaseDate?: string
    allocations?: {
      employee: {
        firstName: string
        lastName: string
        employeeCode: string
      }
    }[]
  }
  onClick?: () => void
  showDetails?: boolean
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ALLOCATED: 'bg-blue-100 text-blue-800',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
}

const typeIcons: Record<string, any> = {
  LAPTOP: Laptop,
  DESKTOP: Laptop,
  MOBILE: Package,
  TABLET: Package,
  MONITOR: Package,
  KEYBOARD: Package,
  MOUSE: Package,
  HEADSET: Package,
  PRINTER: Package,
  OTHER: Package,
}

export function AssetCard({ asset, onClick, showDetails = false }: AssetCardProps) {
  const Icon = typeIcons[asset.type] || Package
  const currentAllocation = asset.allocations?.find((a: any) => !a.returnDate)

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-lg">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{asset.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {asset.assetCode}
              </CardDescription>
            </div>
          </div>
          <Badge className={statusColors[asset.status]}>{asset.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Type: </span>
            <Badge variant="outline">{asset.type}</Badge>
          </div>

          {asset.brand && asset.model && (
            <div>
              <span className="text-muted-foreground">Model: </span>
              <span className="font-medium">
                {asset.brand} {asset.model}
              </span>
            </div>
          )}

          {asset.serialNumber && (
            <div>
              <span className="text-muted-foreground">Serial: </span>
              <span className="font-mono text-xs">{asset.serialNumber}</span>
            </div>
          )}

          {currentAllocation && (
            <div>
              <span className="text-muted-foreground">Allocated to: </span>
              <span className="font-medium">
                {currentAllocation.employee.firstName}{' '}
                {currentAllocation.employee.lastName}
              </span>
            </div>
          )}
        </div>

        {showDetails && (
          <Button className="w-full mt-4" size="sm" variant="outline">
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
