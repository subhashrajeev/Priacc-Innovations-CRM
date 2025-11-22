'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ProjectCard } from '@/components/projects/project-card'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  Loader2,
  DollarSign,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { isManager } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusColors: Record<string, string> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  PROSPECT: 'outline',
  LOST: 'destructive',
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [client, setClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const canManageClients = session?.user?.role ? isManager(session.user.role) : false

  useEffect(() => {
    if (params.id) {
      fetchClient()
    }
  }, [params.id])

  const fetchClient = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setClient(result.data)
      } else {
        toast.error('Failed to fetch client details')
        router.push('/projects/clients')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      toast.error('An error occurred while fetching client')
      router.push('/projects/clients')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalRevenue = client.invoices
    ?.filter((inv: any) => inv.status === 'PAID')
    .reduce((sum: number, inv: any) => sum + inv.total, 0) || 0

  const activeProjects = client.projects?.filter((p: any) =>
    p.status === 'ACTIVE' || p.status === 'PLANNING'
  ).length || 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects/clients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <Badge variant={statusColors[client.status]}>{client.status}</Badge>
            </div>
            <p className="text-muted-foreground">{client.code}</p>
          </div>
        </div>
        {canManageClients && (
          <Button asChild>
            <Link href={`/projects/clients/${client.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client._count?.projects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client._count?.invoices || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                client.invoices
                  ?.filter((inv: any) => inv.status === 'SENT' || inv.status === 'OVERDUE')
                  .reduce((sum: number, inv: any) => sum + inv.total, 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">
            Projects
            <Badge variant="secondary" className="ml-2">
              {client._count?.projects || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices
            <Badge variant="secondary" className="ml-2">
              {client._count?.invoices || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.industry && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Industry</h4>
                    <p className="text-sm text-muted-foreground">{client.industry}</p>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      {client.website}
                    </a>
                  </div>
                )}
                {(client.address || client.city || client.state) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      {client.address && <p>{client.address}</p>}
                      <p>
                        {[client.city, client.state, client.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Person</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.contactPerson && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Name</h4>
                    <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
                  </div>
                )}
                {client.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${client.contactEmail}`} className="text-sm hover:underline">
                      {client.contactEmail}
                    </a>
                  </div>
                )}
                {client.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${client.contactPhone}`} className="text-sm hover:underline">
                      {client.contactPhone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          {client.projects && client.projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {client.projects.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This client has no projects
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          {client.invoices && client.invoices.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {client.invoices.map((invoice: any) => (
                    <Link
                      key={invoice.id}
                      href={`/projects/invoices/${invoice.id}`}
                      className="block p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(invoice.issueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(invoice.total)}</p>
                          <Badge
                            variant={
                              invoice.status === 'PAID'
                                ? 'default'
                                : invoice.status === 'OVERDUE'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This client has no invoices
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
