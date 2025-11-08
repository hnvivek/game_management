import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="default">
              <Link href="/vendor/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/vendor/bookings">Go to Bookings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

