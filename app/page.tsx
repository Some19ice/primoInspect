'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/lib/hooks/use-supabase-auth'
import {
  CheckCircle,
  Zap,
  Shield,
  Users,
  BarChart3,
  FileCheck,
  ArrowRight,
  Play,
} from 'lucide-react'

export default function Home() {
  const { user, profile, loading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (user && profile) {
      switch (profile.role) {
        case 'EXECUTIVE':
          router.push('/dashboard/executive')
          break
        case 'PROJECT_MANAGER':
          router.push('/dashboard/manager')
          break
        case 'INSPECTOR':
          router.push('/dashboard/inspector')
          break
        default:
          router.push('/dashboard/inspector')
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-900">PrimoInspect</span>
              </div>
              <Button
                onClick={() => router.push('/auth/signin')}
                className="bg-green-600 hover:bg-green-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-blue-50 to-white pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Renewable Energy Inspections with Digital Intelligence
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                PrimoInspect streamlines field operations with real-time collaboration, smart checklists, and automated reporting—purpose-built for utility-scale renewable energy projects.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => router.push('/auth/signin')}
                  className="bg-green-600 hover:bg-green-700 text-lg px-8"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8"
                >
                  <Play className="mr-2 h-5 w-5" /> Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">40%</div>
                  <div className="text-sm text-gray-600">Faster Inspections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">95%+</div>
                  <div className="text-sm text-gray-600">Data Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">Real-Time</div>
                  <div className="text-sm text-gray-600">Collaboration</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">SOC 2</div>
                  <div className="text-sm text-gray-600">Certified</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for Modern Inspections
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Purpose-built for renewable energy projects with features that streamline your entire workflow
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-green-600" />}
                title="Real-Time Collaboration"
                description="Live updates, instant notifications, and synchronized data across all devices for seamless team coordination."
              />
              <FeatureCard
                icon={<FileCheck className="h-8 w-8 text-blue-600" />}
                title="Smart Checklists"
                description="Dynamic inspection forms with evidence tracking, validation rules, and customizable templates."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8 text-purple-600" />}
                title="Role-Based Dashboards"
                description="Tailored views for Executives, Project Managers, and Field Inspectors with relevant KPIs."
              />
              <FeatureCard
                icon={<CheckCircle className="h-8 w-8 text-orange-600" />}
                title="Approval Workflows"
                description="Structured review process with multi-level approvals, escalation, and complete audit trails."
              />
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8 text-indigo-600" />}
                title="Advanced Analytics"
                description="Real-time dashboards with performance metrics, trend analysis, and exportable reports."
              />
              <FeatureCard
                icon={<Shield className="h-8 w-8 text-teal-600" />}
                title="Enterprise Security"
                description="SOC 2 Type II certified with end-to-end encryption, MFA, and role-based access control."
              />
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Built for Every Role in Your Organization
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <RoleCard
                title="Field Inspectors"
                description="Mobile-optimized interface for efficient data collection with evidence capture and offline capability."
                benefits={[
                  'Touch-friendly inspection forms',
                  'Photo and video evidence',
                  'GPS location tracking',
                  'One-tap submission',
                ]}
              />
              <RoleCard
                title="Project Managers"
                description="Complete project visibility with real-time dashboards, automated workflows, and team coordination."
                benefits={[
                  'Live project dashboards',
                  'Automated task assignment',
                  'Instant issue notifications',
                  'One-click reporting',
                ]}
              />
              <RoleCard
                title="Executives"
                description="Strategic insights with cross-project analytics, compliance tracking, and performance metrics."
                benefits={[
                  'Portfolio-wide metrics',
                  'Compliance reporting',
                  'ROI tracking',
                  'Client satisfaction data',
                ]}
              />
            </div>
          </div>
        </section>

        {/* Demo CTA Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-900 to-green-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Inspections?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Try the platform with pre-configured demo accounts for all roles. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push('/auth/signin')}
                className="bg-white text-blue-900 hover:bg-gray-100 text-lg px-8"
              >
                Access Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-100">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Full feature access
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Pre-loaded demo data
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                All user roles
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-white font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white">Features</a></li>
                  <li><a href="#" className="hover:text-white">Pricing</a></li>
                  <li><a href="#" className="hover:text-white">Demo</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white">About</a></li>
                  <li><a href="#" className="hover:text-white">Contact</a></li>
                  <li><a href="#" className="hover:text-white">Careers</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white">Documentation</a></li>
                  <li><a href="#" className="hover:text-white">Support</a></li>
                  <li><a href="#" className="hover:text-white">Blog</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white">Privacy</a></li>
                  <li><a href="#" className="hover:text-white">Terms</a></li>
                  <li><a href="#" className="hover:text-white">Security</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center">
              <p>&copy; 2025 PrimoInspect. All rights reserved.</p>
              <p className="mt-2 text-sm">Digital inspections for renewable energy projects</p>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return null
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function RoleCard({
  title,
  description,
  benefits,
}: {
  title: string
  description: string
  benefits: string[]
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h3 className="text-2xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
