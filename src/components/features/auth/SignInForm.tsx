'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    const result = await login(email, password)

    if (result.success) {
      // Navigation is handled by AuthProvider based on user role
      // No need to manually navigate here
    } else {
      setError(result.error || 'Invalid email or password')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Sign in to your GameHub account
                </p>
              </div>

              {error && (
                <Alert className="border-destructive/20 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive-foreground text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <div className="absolute inset-0 h-full w-full flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto">
                  <span className="text-2xl">🏆</span>
                </div>
                <h2 className="text-2xl font-bold">GameHub</h2>
                <p className="text-muted-foreground max-w-sm">
                  Book sports venues easily and manage your games in one place.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Real-time venue availability</p>
                  <p>✓ Easy team management</p>
                  <p>✓ Secure payments</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <Link href="/terms">Terms of Service</Link>{" "}
        and <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  )
}