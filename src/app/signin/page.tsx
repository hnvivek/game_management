import SignInForm from '@/components/auth/SignInForm'

export const metadata = {
  title: 'Sign In - GameHub',
  description: 'Sign in to your GameHub account to continue booking sports venues',
}

export default function SignInPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignInForm />
      </div>
    </div>
  )
}