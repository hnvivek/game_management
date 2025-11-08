'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  MessageSquare,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Star,
  TrendingUp
} from 'lucide-react'

interface VendorApplication {
  id: string
  businessName: string
  contactName: string
  email: string
  phone: string
  location: string
  category: string
  status: 'pending' | 'approved' | 'rejected' | 'reviewing'
  submittedDate: string
  reviewDate?: string
  reviewer?: string
  revenue?: number
  rating?: number
  description: string
  venues: number
  documents: {
    type: string
    status: 'verified' | 'pending' | 'rejected'
    url: string
  }[]
  notes: string
  applicationScore: number
}

const mockApplications: VendorApplication[] = [
  {
    id: '1',
    businessName: 'Elite Sports Facilities',
    contactName: 'Michael Rodriguez',
    email: 'michael@elitesports.com',
    phone: '+1 (555) 123-4567',
    location: 'Los Angeles, CA',
    category: 'Sports Complex',
    status: 'pending',
    submittedDate: '2024-01-15',
    description: 'Premium sports facility with 8 soccer fields, 4 basketball courts, and 2 tennis courts',
    venues: 14,
    documents: [
      { type: 'Business License', status: 'verified', url: '#' },
      { type: 'Insurance Certificate', status: 'verified', url: '#' },
      { type: 'Permit Documents', status: 'pending', url: '#' }
    ],
    notes: 'High-quality facility with excellent reviews on local platforms',
    applicationScore: 85
  },
  {
    id: '2',
    businessName: 'Community Recreation Center',
    contactName: 'Sarah Johnson',
    email: 'sarah@communityrec.org',
    phone: '+1 (555) 987-6543',
    location: 'Chicago, IL',
    category: 'Community Center',
    status: 'reviewing',
    submittedDate: '2024-01-12',
    reviewDate: '2024-01-16',
    reviewer: 'Admin Team',
    description: 'Multi-purpose community center serving local youth programs and adult leagues',
    venues: 6,
    documents: [
      { type: 'Business License', status: 'verified', url: '#' },
      { type: 'Insurance Certificate', status: 'verified', url: '#' },
      { type: 'Safety Inspection', status: 'verified', url: '#' }
    ],
    notes: 'Great community impact, facility needs minor upgrades',
    applicationScore: 78
  },
  {
    id: '3',
    businessName: 'Pro Athletic Centers',
    contactName: 'David Chen',
    email: 'dchen@proathletic.com',
    phone: '+1 (555) 456-7890',
    location: 'New York, NY',
    category: 'Private Facility',
    status: 'approved',
    submittedDate: '2024-01-08',
    reviewDate: '2024-01-10',
    reviewer: 'Admin Team',
    revenue: 95400,
    rating: 4.8,
    description: 'Professional-grade training facility with NBA-level basketball courts',
    venues: 8,
    documents: [
      { type: 'Business License', status: 'verified', url: '#' },
      { type: 'Insurance Certificate', status: 'verified', url: '#' },
      { type: 'Permit Documents', status: 'verified', url: '#' }
    ],
    notes: 'Approved quickly due to excellent facility and strong business model',
    applicationScore: 92
  },
  {
    id: '4',
    businessName: 'Urban Sports Hub',
    contactName: 'Jessica Williams',
    email: 'jwilliams@urbansports.com',
    phone: '+1 (555) 234-5678',
    location: 'Houston, TX',
    category: 'Sports Complex',
    status: 'rejected',
    submittedDate: '2024-01-05',
    reviewDate: '2024-01-09',
    reviewer: 'Admin Team',
    description: 'Indoor sports complex in downtown area',
    venues: 4,
    documents: [
      { type: 'Business License', status: 'rejected', url: '#' },
      { type: 'Insurance Certificate', status: 'verified', url: '#' },
      { type: 'Permit Documents', status: 'pending', url: '#' }
    ],
    notes: 'Rejected due to incomplete business documentation and permit issues',
    applicationScore: 45
  }
]

export function VendorApprovalWorkflow() {
  const [applications, setApplications] = useState<VendorApplication[]>(mockApplications)
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null)

  const handleApprove = (applicationId: string) => {
    setApplications(prev => prev.map(app =>
      app.id === applicationId
        ? { ...app, status: 'approved' as const, reviewDate: new Date().toISOString().split('T')[0], reviewer: 'Admin Team' }
        : app
    ))
  }

  const handleReject = (applicationId: string) => {
    setApplications(prev => prev.map(app =>
      app.id === applicationId
        ? { ...app, status: 'rejected' as const, reviewDate: new Date().toISOString().split('T')[0], reviewer: 'Admin Team' }
        : app
    ))
  }

  const getStatusIcon = (status: VendorApplication['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'reviewing':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: VendorApplication['status']) => {
    const variants = {
      pending: 'default',
      approved: 'default',
      rejected: 'destructive',
      reviewing: 'secondary'
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredApplications = {
    pending: applications.filter(app => app.status === 'pending'),
    reviewing: applications.filter(app => app.status === 'reviewing'),
    approved: applications.filter(app => app.status === 'approved'),
    rejected: applications.filter(app => app.status === 'rejected')
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Pending Review</p>
                <p className="text-2xl font-bold">{filteredApplications.pending.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Under Review</p>
                <p className="text-2xl font-bold">{filteredApplications.reviewing.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold">{filteredApplications.approved.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold">{filteredApplications.rejected.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({filteredApplications.pending.length})
          </TabsTrigger>
          <TabsTrigger value="reviewing">
            Under Review ({filteredApplications.reviewing.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({filteredApplications.approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filteredApplications.rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredApplications.pending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending vendor applications to review.</p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.pending.map(application => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-semibold">{application.businessName}</h3>
                        {getStatusBadge(application.status)}
                        <div className={`font-medium ${getScoreColor(application.applicationScore)}`}>
                          Score: {application.applicationScore}/100
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{application.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{application.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{application.phone}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Applied: {application.submittedDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <span>{application.venues} venues</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{application.category}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{application.description}</p>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm font-medium">Documents:</span>
                        {application.documents.map((doc, index) => (
                          <Badge
                            key={index}
                            variant={doc.status === 'verified' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {doc.type}
                          </Badge>
                        ))}
                      </div>

                      {application.notes && (
                        <Alert>
                          <MessageSquare className="h-4 w-4" />
                          <AlertDescription>{application.notes}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Vendor Application Review</DialogTitle>
                          </DialogHeader>
                          {selectedApplication && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Business Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Name:</strong> {selectedApplication.businessName}</p>
                                    <p><strong>Contact:</strong> {selectedApplication.contactName}</p>
                                    <p><strong>Email:</strong> {selectedApplication.email}</p>
                                    <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                                    <p><strong>Location:</strong> {selectedApplication.location}</p>
                                    <p><strong>Category:</strong> {selectedApplication.category}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Application Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Submitted:</strong> {selectedApplication.submittedDate}</p>
                                    <p><strong>Venues:</strong> {selectedApplication.venues}</p>
                                    <p><strong>Score:</strong> <span className={`font-medium ${getScoreColor(selectedApplication.applicationScore)}`}>{selectedApplication.applicationScore}/100</span></p>
                                    <p><strong>Status:</strong> {getStatusBadge(selectedApplication.status)}</p>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Business Description</h4>
                                <p className="text-sm text-muted-foreground">{selectedApplication.description}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Documents</h4>
                                <div className="space-y-2">
                                  {selectedApplication.documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">{doc.type}</span>
                                      </div>
                                      <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                                        {doc.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Review Notes</h4>
                                <p className="text-sm text-muted-foreground">{selectedApplication.notes}</p>
                              </div>

                              <div className="flex items-center gap-2 pt-4 border-t">
                                <Button
                                  onClick={() => handleApprove(selectedApplication.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve Application
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(selectedApplication.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject Application
                                </Button>
                                <Button variant="outline">
                                  Request More Info
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reviewing" className="space-y-4">
          {filteredApplications.reviewing.map(application => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold">{application.businessName}</h3>
                      {getStatusBadge(application.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{application.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Being reviewed by {application.reviewer} since {application.reviewDate}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Continue Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {filteredApplications.approved.map(application => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold">{application.businessName}</h3>
                      {getStatusBadge(application.status)}
                      {application.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{application.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{application.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Approved by {application.reviewer}</span>
                      <span>Approved on {application.reviewDate}</span>
                      {application.revenue && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          ${application.revenue.toLocaleString()} revenue
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {filteredApplications.rejected.map(application => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold">{application.businessName}</h3>
                      {getStatusBadge(application.status)}
                      <div className={`font-medium ${getScoreColor(application.applicationScore)}`}>
                        Score: {application.applicationScore}/100
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{application.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Rejected by {application.reviewer} on {application.reviewDate}
                    </p>
                    {application.notes && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{application.notes}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}