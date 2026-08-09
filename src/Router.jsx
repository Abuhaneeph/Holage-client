import { Suspense, lazy } from "react"
import { useAppContext } from "./context/AppContext"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"

// Code-split everything past the landing/login screen — each role only ever loads their own
// dashboard chunk instead of the whole app (shipper/trucker/fleet-manager/admin/agent/staff/
// driver dashboards were all previously bundled into one multi-MB chunk downloaded by everyone).
const SignupPage = lazy(() => import("./pages/SignupPage"))
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"))
const EmailVerificationPage = lazy(() => import("./pages/EmailVerificationPage"))
const KYCPage = lazy(() => import("./pages/KYCPage"))
const SuccessPage = lazy(() => import("./pages/SuccessPage"))
const TruckerDashboard = lazy(() => import("./pages/TruckerDashboard"))
const ShipperDashboard = lazy(() => import("./pages/ShipperDashboard"))
const FleetManagerDashboard = lazy(() => import("./pages/FleetManagerDashboard"))
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"))
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"))
const StaffSignupPage = lazy(() => import("./pages/StaffSignupPage"))
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"))
const ComplaintPage = lazy(() => import("./pages/ComplaintPage"))
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"))

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
    <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary/20 border-t-primary"></div>
    <p className="text-text-secondary text-sm font-medium">Loading...</p>
  </div>
)

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

  return <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
}

export default Router
