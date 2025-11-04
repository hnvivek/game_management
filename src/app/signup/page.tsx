import SignUpForm from '@/components/auth/SignUpForm'

export const metadata = {
  title: 'Sign Up - GameHub',
  description: 'Create your GameHub account and start booking sports venues',
}

export default function SignUpPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignUpForm />
      </div>
    </div>
  )
}