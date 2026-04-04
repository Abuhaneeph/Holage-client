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
import FleetManagerDashboard from "./pages/FleetManagerDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import AgentDashboard from "./pages/AgentDashboard"
import StaffSignupPage from "./pages/StaffSignupPage"
import StaffDashboard from "./pages/StaffDashboard"
import ComplaintPage from "./pages/ComplaintPage"
import DriverLoginPage from "./pages/DriverLoginPage"
import DriverDashboard from "./pages/DriverDashboard"
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
      case "fleet-manager-dashboard":
        return <FleetManagerDashboard />
      case "admin-dashboard":
        return <AdminDashboard />
      case "agent-dashboard":
        return <AgentDashboard />
      case "staff-signup":
        return <StaffSignupPage />
      case "staff-dashboard":
        return <StaffDashboard />
      case "complaint":
        return <ComplaintPage />
      case "driver-login":
        // Redirect to unified login page with driver type selected
        return <LoginPage />
      case "driver-dashboard":
        return <DriverDashboard />
      default:
        return <LandingPage />
    }
  }

  return renderPage()
}

export default Router
