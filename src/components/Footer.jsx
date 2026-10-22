import { LogIn, UserPlus } from "lucide-react"
import { useAppContext } from "../context/AppContext"

const Footer = () => {
  const { navigateTo } = useAppContext()

  return (
    <footer className="py-16 bg-black/50 backdrop-blur-sm border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigateTo("login")}
              className="-m-2 flex items-center space-x-2 p-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => navigateTo("signup")}
              className="-m-2 flex items-center space-x-2 p-2 text-secondary hover:text-accent transition-colors text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </div>
          <p className="text-gray-400 text-sm text-center">
            © 2026 Holage Africa Limited. All rights reserved.
            <span className="mx-2">|</span>
            <span
              className="text-secondary cursor-pointer hover:text-accent transition-colors"
              onClick={() => navigateTo("privacy-policy")}
            >
              Privacy Policy
            </span>
            <span className="mx-2">|</span>
            <span
              className="text-accent cursor-pointer hover:text-secondary transition-colors"
              onClick={() => navigateTo("terms-of-service")}
            >
              Terms of Service
            </span>
            <span className="mx-2">|</span>
            <span
              className="text-secondary cursor-pointer hover:text-accent transition-colors"
              onClick={() => navigateTo("delete-account")}
            >
              Delete Account
            </span>
          </p>
          <p className="text-gray-500 text-xs text-center">
            3, Katako, Mallam Kure St, Jos, Plateau State, Nigeria
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
