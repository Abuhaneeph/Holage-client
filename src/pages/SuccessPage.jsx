"use client"

import { CheckCircle2, AlertCircle } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"

const SuccessPage = () => {
  const { navigateTo, userRole, resetForm } = useAppContext()

  const handleStartOver = () => {
    resetForm()

    if (userRole === "trucker") {
      navigateTo("trucker-dashboard")
    } else if (userRole === "shipper") {
      navigateTo("shipper-dashboard")
    } else if (userRole === "fleet_manager") {
      navigateTo("fleet-manager-dashboard")
    } else {
      navigateTo("landing")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-border p-8 text-center shadow-xl">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Welcome to HOLAGE!
            </h2>

            <p className="text-text-secondary mb-6">
              {userRole === "trucker"
                ? "Your trucker application has been submitted successfully. You'll receive an email confirmation once your account is approved."
                : userRole === "fleet_manager"
                ? "Your KYC information has been submitted successfully. You can now access your dashboard and manage your fleet."
                : "Your shipper account has been created successfully. You can now start booking trucks for your shipments."}
            </p>

            <div className="bg-muted/50 border border-border rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-secondary mt-0.5 mr-3" />
                <div className="text-left">
                  <h4 className="font-medium text-text-primary">What's Next?</h4>
                  <p className="text-sm text-text-secondary mt-1">
                    {userRole === "trucker"
                      ? "Our team will review your application within 24-48 hours. You'll receive notifications via email and SMS."
                      : userRole === "fleet_manager"
                      ? "Your KYC is under review. You can access your dashboard and start managing your fleet while your documents are being verified."
                      : "You can now access your dashboard and start creating shipment requests. Check your email for getting started guide."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleStartOver}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </button>

              <button
                onClick={() => navigateTo("landing")}
                className="w-full bg-surface text-text-secondary py-3 rounded-xl font-semibold hover:bg-muted transition-all duration-200 border border-border"
              >
                Back to Home
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-text-secondary">
                Need help? Contact our support team at support@holage.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessPage