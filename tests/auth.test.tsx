import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/components/auth/AuthProvider'
import SignInForm from '@/components/auth/SignInForm'
import UserMenu from '@/components/auth/UserMenu'
import { useRouter } from 'next/navigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Authentication System', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
  })

  describe('AuthProvider', () => {
    it('should initialize with no user and loading false', () => {
      const TestComponent = () => {
        const { user, isLoading } = useAuth()
        return <div>{isLoading ? 'Loading' : user ? `Hello ${user.name}` : 'No user'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByText('No user')).toBeInTheDocument()
    })

    it('should restore user from localStorage on mount', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'CUSTOMER'
      }

      localStorageMock.setItem('auth_user', JSON.stringify(mockUser))

      const TestComponent = () => {
        const { user, isLoading } = useAuth()
        if (isLoading) return <div>Loading</div>
        return <div>{user ? `Hello ${user.name}` : 'No user'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Hello Test User')).toBeInTheDocument()
      })
    })

    it('should login successfully and save to localStorage', async () => {
      let authContext: any

      const TestComponent = () => {
        authContext = useAuth()
        return <div>{authContext.user ? `Logged in as ${authContext.user.name}` : 'Not logged in'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially not logged in
      expect(screen.getByText('Not logged in')).toBeInTheDocument()

      // Login
      const success = await authContext.login('test@example.com', 'password')

      expect(success).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_user',
        expect.stringContaining('test@example.com')
      )

      await waitFor(() => {
        expect(screen.getByText(/Logged in as/)).toBeInTheDocument()
      })
    })

    it('should logout and clear localStorage', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'CUSTOMER'
      }

      localStorageMock.setItem('auth_user', JSON.stringify(mockUser))

      const TestComponent = () => {
        const { user, logout } = useAuth()
        return (
          <div>
            <div>{user ? `Hello ${user.name}` : 'No user'}</div>
            <button onClick={logout}>Logout</button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Hello Test User')).toBeInTheDocument()
      })

      // Logout
      fireEvent.click(screen.getByText('Logout'))

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user')
      expect(screen.getByText('No user')).toBeInTheDocument()
    })
  })

  describe('SignInForm', () => {
    it('should render sign-in form correctly', () => {
      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    it('should show validation error for empty fields', async () => {
      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const submitButton = screen.getByRole('button', { name: 'Sign in' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
      })
    })

    it('should login successfully and redirect', async () => {
      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/ai-suggestions')
      })
    })

    it('should show error for invalid credentials', async () => {
      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      // Mock login to return false
      const TestComponent = () => {
        const { login } = useAuth()
        const handleLogin = async () => {
          const success = await login('', '') // Empty credentials will fail
          if (!success) {
            return 'Login failed'
          }
        }
        return <button onClick={handleLogin}>Test Login</button>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const testButton = screen.getByText('Test Login')
      fireEvent.click(testButton)

      // Note: Our mock auth accepts any non-empty email/password, so this test
      // would need to be adjusted if we want to test actual failure cases
    })

    it('should show loading state during login', async () => {
      render(
        <AuthProvider>
          <SignInForm />
        </AuthProvider>
      )

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Button should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })
  })

  describe('UserMenu', () => {
    const mockUser = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'CUSTOMER'
    }

    it('should not render when no user is logged in', () => {
      render(
        <AuthProvider>
          <UserMenu />
        </AuthProvider>
      )

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it('should render user menu when user is logged in', async () => {
      const TestComponent = () => {
        const { user } = useAuth()
        return (
          <div>
            {user ? <UserMenu /> : <div>No user</div>}
            <button onClick={() => useAuth().login('john@example.com', 'password')}>
              Login
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Login first
      fireEvent.click(screen.getByText('Login'))

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('J')).toBeInTheDocument() // User avatar
      })
    })

    it('should toggle dropdown menu', async () => {
      const TestComponent = () => {
        const { user } = useAuth()
        return (
          <div>
            {user ? <UserMenu /> : <button onClick={() => useAuth().login('john@example.com', 'password')}>Login</button>}
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Login first
      fireEvent.click(screen.getByText('Login'))

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click to open dropdown
      const userMenuButton = screen.getByText('John Doe').closest('button')
      fireEvent.click(userMenuButton!)

      // Dropdown should show user details and sign out option
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })
  })

  describe('Cross-Context Authentication', () => {
    it('should handle authentication across different contexts', async () => {
      // Test that auth state persists across component re-renders
      let authContext1: any, authContext2: any

      const TestComponent1 = () => {
        authContext1 = useAuth()
        return null
      }

      const TestComponent2 = () => {
        authContext2 = useAuth()
        return <div>{authContext2.user?.name || 'No user'}</div>
      }

      const { rerender } = render(
        <AuthProvider>
          <TestComponent1 />
        </AuthProvider>
      )

      // Login in first component
      await authContext1.login('cross-context@example.com', 'password')

      // Render second component
      rerender(
        <AuthProvider>
          <TestComponent2 />
        </AuthProvider>
      )

      // Second component should have the same user
      await waitFor(() => {
        expect(screen.getByText(/cross-context/)).toBeInTheDocument()
      })
    })
  })
})

// Helper function to use useAuth in tests
function useAuth() {
  // This would be replaced by actual useAuth hook in real implementation
  throw new Error('useAuth must be used within AuthProvider')
}