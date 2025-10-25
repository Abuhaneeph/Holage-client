"use client"

import { useState } from "react"
import { Truck, Menu, X, LogIn, UserPlus } from "lucide-react"
import { useAppContext } from "../context/AppContext"

const Header = ({ transparent = false }) => {
  const { navigateTo } = useAppContext()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className={`${
        transparent
          ? "absolute top-0 left-0 right-0 z-50"
          : "relative"
      } py-4 backdrop-blur-sm bg-white/90 shadow-sm`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigateTo("landing")}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden">
              <img
                src="/assets/holage-logo.png"
                alt="Holage Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {["Home", "How it Works", "Pricing", "Support"].map((label) => (
              <button
                key={label}
                onClick={() => label === "Home" && navigateTo("landing")}
                className="text-text-primary hover:text-secondary transition-colors font-medium"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigateTo("login")}
              className="flex items-center space-x-2 text-text-primary hover:text-secondary transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
            <button
              onClick={() => navigateTo("signup")}
              className="flex items-center space-x-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-primary" />
            ) : (
              <Menu className="w-6 h-6 text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border bg-surface rounded-xl">
            <nav className="flex flex-col space-y-2 px-4">
              {["Home", "How it Works", "Pricing", "Support"].map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    if (label === "Home") navigateTo("landing")
                    setMobileMenuOpen(false)
                  }}
                  className="text-left text-text-primary hover:text-secondary transition-colors py-2"
                >
                  {label}
                </button>
              ))}
              <div className="pt-4 border-t border-border flex flex-col space-y-3">
                <button
                  onClick={() => {
                    navigateTo("login")
                    setMobileMenuOpen(false)
                  }}
                  className="text-left text-text-primary hover:text-secondary transition-colors py-2"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigateTo("signup")
                    setMobileMenuOpen(false)
                  }}
                  className="text-left bg-secondary text-white px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header