'use client'

import { VendorApprovalWorkflow } from '@/components/features/admin/VendorApprovalWorkflow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, Clock, CheckCircle, Users, FileText, Calendar } from 'lucide-react'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'

export default function VendorApprovalPage() {
  return (
    <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        {/* Approval Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                3 submitted this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Review Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3 days</div>
              <p className="text-xs text-muted-foreground">
                -18% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">74%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Reviewers</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                2 applications assigned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Approval Guidelines */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Approval Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Required Documents</h4>
                <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                  <li>• Valid Business License</li>
                  <li>• Insurance Certificate</li>
                  <li>• Facility Permits</li>
                  <li>• Safety Inspection Report</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Quality Standards</h4>
                <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                  <li>• Minimum 4.0/5.0 rating</li>
                  <li>• Application score ≥ 70</li>
                  <li>• Verified contact info</li>
                  <li>• Active website/social</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Review Process</h4>
                <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                  <li>• Document verification (1 day)</li>
                  <li>• Background check (1 day)</li>
                  <li>• Facility inspection (2-3 days)</li>
                  <li>• Final decision (1 day)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Recent Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Elite Sports Facilities', status: 'approved', time: '2 hours ago', reviewer: 'Admin Team', score: 92 },
                  { name: 'Community Recreation Center', status: 'reviewing', time: '1 day ago', reviewer: 'Sarah M.', score: 78 },
                  { name: 'Downtown Athletic Club', status: 'rejected', time: '2 days ago', reviewer: 'Admin Team', score: 45 },
                  { name: 'Premier Tennis Academy', status: 'approved', time: '3 days ago', reviewer: 'John D.', score: 88 },
                  { name: 'City Sports Complex', status: 'approved', time: '1 week ago', reviewer: 'Admin Team', score: 95 }
                ].map((approval, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{approval.name}</span>
                        <Badge variant={
                          approval.status === 'approved' ? 'default' :
                          approval.status === 'reviewing' ? 'secondary' : 'destructive'
                        } className="capitalize text-xs">
                          {approval.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Score: {approval.score}/100</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {approval.time}
                        </span>
                        <span>by {approval.reviewer}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">This Week</span>
                  <Badge variant="secondary">12 applications</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Approved</span>
                  <Badge className="bg-green-100 text-green-800">8</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rejected</span>
                  <Badge className="bg-red-100 text-red-800">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <Badge className="bg-yellow-100 text-yellow-800">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Score</span>
                  <Badge variant="secondary">78.5/100</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processing Time</span>
                  <Badge variant="secondary">1.8 days</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Approval Workflow */}
        <VendorApprovalWorkflow />

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Bulk Actions</h2>
            <p className="text-sm text-muted-foreground">
              Process multiple applications at once
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Reviews
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>
      </div>
  )
}