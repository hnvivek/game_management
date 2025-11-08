'use client'

import { useState, useEffect, useCallback } from 'react'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVendor } from '@/hooks/use-vendor'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StaffMember {
  id: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    avatarUrl?: string
    isActive: boolean
    isEmailVerified: boolean
    lastLoginAt?: string
    createdAt: string
  }
  role: 'VENDOR_ADMIN' | 'VENDOR_STAFF'
  createdAt: string
  recentActivity?: number
}

interface StaffListResponse {
  success: boolean
  data: StaffMember[]
  meta?: {
    pagination?: {
      currentPage: number
      totalPages: number
      totalCount: number
      limit: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    summary?: {
      total: number
      active: number
      inactive: number
      admins: number
      staff: number
    }
  }
}

export default function VendorStaffPage() {
  const { vendorId } = useVendor()
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Add staff dialog
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'VENDOR_STAFF' as 'VENDOR_ADMIN' | 'VENDOR_STAFF'
  })
  const [addingStaff, setAddingStaff] = useState(false)
  const [addStaffError, setAddStaffError] = useState<string | null>(null)

  // Fetch staff list
  const fetchStaff = useCallback(async () => {
    if (!vendorId) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('page', '1')
      params.append('limit', '50')

      const response = await fetch(`/api/vendors/${vendorId}/staff?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch staff')
      }

      const data: StaffListResponse = await response.json()
      
      if (data.success && data.data) {
        setStaff(data.data)
        if (data.meta?.summary) {
          setSummary(data.meta.summary)
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching staff:', err)
      setError(err instanceof Error ? err.message : 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [vendorId, searchQuery, roleFilter, statusFilter])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // Handle add staff
  const handleAddStaff = async () => {
    if (!vendorId) return

    // Validation
    if (!newStaff.name || !newStaff.email) {
      setAddStaffError('Name and email are required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaff.email)) {
      setAddStaffError('Please enter a valid email address')
      return
    }

    try {
      setAddingStaff(true)
      setAddStaffError(null)

      const response = await fetch(`/api/vendors/${vendorId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newStaff.name,
          email: newStaff.email,
          phone: newStaff.phone || undefined,
          role: newStaff.role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to add staff member')
      }

      // Success - reset form and refresh list
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        role: 'VENDOR_STAFF'
      })
      setAddStaffOpen(false)
      setAddStaffError(null)
      fetchStaff()
    } catch (err) {
      console.error('Error adding staff:', err)
      setAddStaffError(err instanceof Error ? err.message : 'Failed to add staff member')
    } finally {
      setAddingStaff(false)
    }
  }

  // Handle toggle staff status
  const handleToggleStatus = async (staffId: string, userId: string, currentStatus: boolean) => {
    if (!vendorId) return

    try {
      const response = await fetch(`/api/vendors/${vendorId}/staff`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          staffIds: [staffId],
          updates: {
            isActive: !currentStatus
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update staff status')
      }

      fetchStaff()
    } catch (err) {
      console.error('Error updating staff status:', err)
      alert('Failed to update staff status')
    }
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && staff.length === 0) {
    return (
      <VendorLayout title="Team Management" subtitle="Loading...">
        <div className="p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout
      title="Team Management"
      subtitle="Manage your staff members and their access"
    >
      <div className="p-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{summary.active}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold">{summary.admins}</p>
                  </div>
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Staff Members</p>
                    <p className="text-2xl font-bold">{summary.staff}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="VENDOR_ADMIN">Admins</SelectItem>
                    <SelectItem value="VENDOR_STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setAddStaffOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              Manage your team members and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No staff members found</p>
                <Button onClick={() => setAddStaffOpen(true)} className="mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Staff Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar>
                        <AvatarImage src={member.user.avatarUrl} />
                        <AvatarFallback>
                          {member.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.user.name}</h3>
                          <Badge variant={member.role === 'VENDOR_ADMIN' ? 'default' : 'secondary'}>
                            {member.role === 'VENDOR_ADMIN' ? 'Admin' : 'Staff'}
                          </Badge>
                          {member.user.isActive ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.user.email}
                          </div>
                          {member.user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.user.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last login: {formatDate(member.user.lastLoginAt)}
                          </div>
                          {member.recentActivity !== undefined && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {member.recentActivity} bookings (30d)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(member.id, member.user.id, member.user.isActive)}
                        >
                          {member.user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Staff Dialog */}
        <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Invite a new team member to help manage your vendor account. They will receive an email invitation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {addStaffError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                  {addStaffError}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name</Label>
                <Input
                  id="staff-name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="John Doe"
                  disabled={addingStaff}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email">Email Address</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="john@example.com"
                  disabled={addingStaff}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone Number (Optional)</Label>
                <Input
                  id="staff-phone"
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  disabled={addingStaff}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-role">Role</Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(value: 'VENDOR_ADMIN' | 'VENDOR_STAFF') =>
                    setNewStaff({ ...newStaff, role: value })
                  }
                  disabled={addingStaff}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VENDOR_STAFF">Staff Member</SelectItem>
                    <SelectItem value="VENDOR_ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins have full access to manage settings, staff, and all vendor features.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddStaffOpen(false)
                  setNewStaff({
                    name: '',
                    email: '',
                    phone: '',
                    role: 'VENDOR_STAFF'
                  })
                  setAddStaffError(null)
                }}
                disabled={addingStaff}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStaff}
                disabled={addingStaff || !newStaff.name || !newStaff.email}
              >
                {addingStaff ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </VendorLayout>
  )
}

