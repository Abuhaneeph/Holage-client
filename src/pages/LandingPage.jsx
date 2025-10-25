"use client"

import { Package, Shield, Truck, ArrowRight, Globe, Zap } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"

const LandingPage = () => {
  const { navigateTo, setUserRole } = useAppContext()

  const handleRoleSelect = (role) => {
    setUserRole(role)
    navigateTo("signup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header transparent={true} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-secondary/70 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-full border border-secondary/30 backdrop-blur-sm">
              <span className="text-secondary text-sm font-medium">🚀 Revolutionizing African Logistics</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Africa's Most
              <span className="block bg-gradient-to-r from-secondary via-accent to-secondary/80 bg-clip-text text-transparent animate-pulse">
                Advanced Freight
              </span>
              <span className="block bg-gradient-to-r from-accent via-secondary to-accent/80 bg-clip-text text-transparent">
                Ecosystem
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect shippers and truckers across Africa with our AI-powered platform. Experience seamless booking,
              real-time tracking, and secure payments in one unified ecosystem.
            </p>

            {/* Feature highlights */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
              <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-secondary/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Lightning Fast Booking</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Book trucks in under 60 seconds with our streamlined process and smart matching algorithm.
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-accent/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Real-time GPS Tracking</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Monitor your shipments with precision GPS tracking and instant notifications.
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-secondary/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Bank-level Security</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Advanced encryption and KYC verification ensure maximum safety for all transactions.
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto">
              <button
                onClick={() => handleRoleSelect("shipper")}
                className="group bg-gradient-to-r from-secondary to-accent text-white px-8 py-4 rounded-2xl font-bold hover:from-secondary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-secondary/25 flex items-center justify-center space-x-2"
              >
                <Package className="w-5 h-5" />
                <span>Ship Your Goods</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => handleRoleSelect("trucker")}
                className="group bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-2xl font-bold hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-primary/25 flex items-center justify-center space-x-2"
              >
                <Truck className="w-5 h-5" />
                <span>Drive & Earn</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/5 backdrop-blur-sm border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                50K+
              </div>
              <div className="text-gray-300">Active Users</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                25K+
              </div>
              <div className="text-gray-300">Successful Deliveries</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                15+
              </div>
              <div className="text-gray-300">African Countries</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                99.9%
              </div>
              <div className="text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How HOLAGE Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Simple, fast, and secure - get started in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-warning rounded-full animate-ping"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Create & Verify</h3>
              <p className="text-gray-300 leading-relaxed">
                Sign up with your details and complete our secure KYC verification process in minutes.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <span className="text-white font-bold text-2xl">2</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full animate-ping animation-delay-1000"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Match & Connect</h3>
              <p className="text-gray-300 leading-relaxed">
                Our AI instantly matches shippers with available truckers based on location, capacity, and preferences.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-accent to-secondary rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <span className="text-white font-bold text-2xl">3</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-ping animation-delay-2000"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Track & Deliver</h3>
              <p className="text-gray-300 leading-relaxed">
                Monitor your shipment in real-time and receive instant notifications upon successful delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-black/50 backdrop-blur-sm border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2024 HOLAGE. All rights reserved.
              <span className="mx-2">|</span>
              <span className="text-secondary cursor-pointer hover:text-accent transition-colors">
                Privacy Policy
              </span>
              <span className="mx-2">|</span>
              <span className="text-accent cursor-pointer hover:text-secondary transition-colors">
                Terms of Service
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage