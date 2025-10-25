import { useAppContext } from "./context/AppContext"
import LandingPage from "./pages/LandingPage"
import SignupPage from "./pages/SignupPage"
import LoginPage from "./pages/LoginPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import EmailVerificationPage from "./pages/EmailVerificationPage"
import KYCPage from "./pages/KYCPage"
import SuccessPage from "./pages/SuccessPage"
import TruckerDashboard from "./pages/TruckerDashboard"
import ShipperDashboard from "./pages/ShipperDashboard"
const Router = () => {
  const { currentPage } = useAppContext()

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage />
      case "signup":
        return <SignupPage />
      case "login":
        return <LoginPage />
      case "forgot-password":
        return <ForgotPasswordPage />
      case "email-verification":
        return <EmailVerificationPage />
      case "kyc":
        return <KYCPage />
      case "success":
        return <SuccessPage />
      case "trucker-dashboard":
        return <TruckerDashboard />
      case "shipper-dashboard":
        return <ShipperDashboard />
      default:
        return <LandingPage />
    }
  }

  return renderPage()
}

export default Router
