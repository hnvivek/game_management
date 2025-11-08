import { VendorSignUpForm } from '@/components/features/auth/VendorSignUpForm'
import Link from 'next/link'

export default function VendorSignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900">GameHub</span>
          </div>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <VendorSignUpForm />
      </div>
    </div>
  )
}