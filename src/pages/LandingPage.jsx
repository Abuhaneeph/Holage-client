"use client"

import { useEffect, useState } from "react"
import { Package, Shield, Truck, ArrowRight, Globe, Zap, UserPlus } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"
import Reveal from "../components/Reveal"

const heroSlides = [
  {
    id: "ai-matching",
    eyebrow: "AI-Powered Freight",
    titleLineOne: "Africa's most advanced",
    titleHighlight: "Freight Network",
    titleLineTwo: "Built for scale",
    description:
      "From instant truck sourcing to guaranteed settlements, Holage keeps every shipment connected, transparent, and on schedule.",
    image: "https://www.logupdateafrica.com/h-upload/2023/01/17/1500x900_35121-shutterstock2172075163-africa-tech-logistics.webp",
  },
  {
    id: "visibility",
    eyebrow: "Live Supply-Chain Visibility",
    titleLineOne: "Realtime control of",
    titleHighlight: "Shipments & Payments",
    titleLineTwo: "Inside one smart hub",
    description:
      "Follow every load, approve payments, and keep partners aligned from a single real-time dashboard.",
    image: "https://cdn.guardian.ng/wp-content/uploads/2020/08/apapa.jpg",
  },
  {
    id: "network",
    eyebrow: "Trusted by Enterprises",
    titleLineOne: "Scale confidently with",
    titleHighlight: "Verified Drivers",
    titleLineTwo: "and instant payouts",
    description:
      "Access a vetted driver community, settle earnings instantly, and rely on 24/7 ops coverage across Africa.",
    image: "https://cdn.guardian.ng/wp-content/uploads/2019/10/000_1LL31N.jpg",
  },
]

const LandingPage = () => {
  const { navigateTo, setUserRole, navigateToSignupWithRole } = useAppContext()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const handleRoleSelect = (role) => {
    setUserRole(role)
    navigateTo("signup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header transparent={true} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#070b1d]/92 via-[#0c1230]/85 to-[#131f45]/78" />
            </div>
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-40 sm:pt-48 lg:pt-56 pb-20">
          <div className="text-center mb-16">
            <div className="relative mx-auto min-h-[240px] sm:min-h-[300px] max-w-3xl">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4 transition-all duration-700 ease-out ${
                    index === currentSlide ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-8"
                  }`}
                >
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.5rem] font-semibold uppercase tracking-[0.35em] text-white/80 backdrop-blur-sm sm:text-[0.65rem] md:text-xs">
                    {slide.eyebrow}
                  </span>
                  <h1 className="text-balance text-white font-bold leading-tight text-[clamp(1.5rem,4.5vw,3.8rem)] sm:text-[clamp(2.2rem,4.5vw,3.8rem)] md:text-[clamp(2.6rem,4vw,4.2rem)] lg:text-[clamp(2.8rem,3.5vw,4.4rem)]">
                    <span className="block">{slide.titleLineOne}</span>
                    <span className="block bg-gradient-to-r from-secondary via-accent to-secondary/80 bg-clip-text text-transparent text-[clamp(1.7rem,5vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] md:text-[clamp(2.9rem,4.5vw,4.6rem)] lg:text-[clamp(3.2rem,4vw,4.8rem)]">
                      {slide.titleHighlight}
                    </span>
                    {slide.titleLineTwo && (
                      <span className="block text-[clamp(1.5rem,4.5vw,3.8rem)] sm:text-[clamp(2.2rem,4.5vw,3.8rem)] md:text-[clamp(2.6rem,4vw,4.2rem)] lg:text-[clamp(2.8rem,3.5vw,4.4rem)]">
                        {slide.titleLineTwo}
                      </span>
                    )}
                  </h1>
                  <p className="max-w-2xl text-xs text-gray-200 leading-relaxed sm:text-sm md:text-base lg:text-lg">
                    {slide.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12 mb-12">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast Booking",
                  copy: "Book trucks in under 60 seconds with our streamlined process and smart matching algorithm.",
                },
                {
                  icon: Globe,
                  title: "Real-time GPS Tracking",
                  copy: "Monitor your shipments with precision GPS tracking and instant notifications.",
                },
                {
                  icon: Shield,
                  title: "Bank-level Security",
                  copy: "Advanced encryption and KYC verification ensure maximum safety for all transactions.",
                },
              ].map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Reveal
                    key={feature.title}
                    delay={index * 120}
                    className="group bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-secondary/20"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{feature.copy}</p>
                  </Reveal>
                )
              })}
            </div>

            <Reveal delay={250} className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 justify-center max-w-4xl mx-auto">
              <button
                onClick={() => handleRoleSelect("shipper")}
                className="group bg-gradient-to-r from-secondary to-accent text-white px-8 py-4 rounded-2xl font-bold hover:from-secondary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-secondary/25 flex items-center justify-center space-x-2"
              >
                <Package className="w-5 h-5" />
                <span>Ship Your Goods</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => handleRoleSelect("trucker")}
                className="group bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-2xl font-bold hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-primary/25 flex items-center justify-center space-x-2"
              >
                <Truck className="w-5 h-5" />
                <span>Drive & Earn</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => navigateToSignupWithRole("agent")}
                className="group border-2 border-white/40 bg-white/10 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/15 hover:border-white/60 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2 backdrop-blur-sm"
              >
                <UserPlus className="w-5 h-5" />
                <span>Register as an agent</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Reveal>

            <div className="mt-8 flex justify-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/5 backdrop-blur-sm border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { figure: "50K+", label: "Active Users" },
              { figure: "25K+", label: "Successful Deliveries" },
              { figure: "15+", label: "African Countries" },
              { figure: "99.9%", label: "Uptime" },
            ].map((stat, index) => (
              <Reveal
                key={stat.label}
                delay={index * 120}
                className="group"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.figure}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
        <Reveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How HOLAGE Works</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Simple, fast, and secure - get started in three easy steps
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {[
            {
              title: "Create & Verify",
              description: "Sign up with your details and complete our secure KYC verification process in minutes.",
              badge: "1",
              pingClass: "bg-warning",
            },
            {
              title: "Match & Connect",
              description: "Our AI instantly matches shippers with available truckers based on location, capacity, and preferences.",
              badge: "2",
              pingClass: "bg-success",
            },
            {
              title: "Track & Deliver",
              description: "Monitor your shipment in real-time and receive instant notifications upon successful delivery.",
              badge: "3",
              pingClass: "bg-primary",
            },
          ].map((step, index) => (
            <Reveal key={step.title} delay={index * 160} className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <span className="text-white font-bold text-2xl">{step.badge}</span>
                </div>
                <div className={`absolute -top-2 -right-2 w-6 h-6 ${step.pingClass} rounded-full animate-ping`}></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-gray-300 leading-relaxed">{step.description}</p>
            </Reveal>
          ))}
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