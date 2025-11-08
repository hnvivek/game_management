import SignUpForm from '@/components/features/auth/SignUpForm'

export const metadata = {
  title: 'Sign Up - GameHub',
  description: 'Create your GameHub account and start booking sports venues',
}

export default function SignUpPage() {
  return (
    <main className="bg-muted flex flex-1 items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignUpForm />
      </div>
    </main>
  )
}