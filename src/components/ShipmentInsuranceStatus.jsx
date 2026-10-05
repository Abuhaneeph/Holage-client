import { useEffect, useState } from "react"
import { Shield, ExternalLink, Loader } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/**
 * Shown on an insured shipment once a trucker is assigned (shipment.truckerId set). Fetches
 * /shipping/shipments/:id/insurance, which also re-checks Tangerine for payment status since
 * there's no webhook — so this doubles as the "did my payment go through" check after a
 * shipper returns from the external PaymentURL.
 */
const ShipmentInsuranceStatus = ({ shipmentId }) => {
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchStatus = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(`${API_BASE_URL}/shipping/shipments/${shipmentId}/insurance`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (cancelled) return
        if (res.ok && data.success) {
          setPolicy(data.policy)
        } else {
          setNotFound(true)
        }
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchStatus()
    return () => { cancelled = true }
  }, [shipmentId])

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-text-secondary text-sm">
        <Loader className="w-4 h-4 animate-spin" /> Checking insurance status...
      </div>
    )
  }

  if (notFound || !policy) {
    // Insurance was requested (that's the only way this component gets mounted — see the
    // Boolean(shipment.insurance) gate in ShipperDashboard.jsx) but no policy record exists,
    // meaning generation was skipped at bid acceptance (e.g. missing identity verification,
    // unmapped cargo type). Silently showing nothing here would look identical to insurance
    // just not having loaded yet, so say so explicitly instead.
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 text-xs text-text-secondary">
          Cargo insurance was requested but couldn't be set up for this shipment. Contact support if you still want it insured.
        </div>
      </div>
    )
  }

  if (policy.policyStatus === "failed") {
    // A failed Tangerine call still creates a DB row (no premium/policy number) — showing the
    // normal premium/status display here would render as confusing blanks (₦0, —, Unknown)
    // instead of explaining what happened.
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 text-xs text-text-secondary">
          Cargo insurance couldn't be set up{policy.failureReason ? `: ${policy.failureReason}` : "."} Your freight booking is unaffected — contact support if you still want this shipment insured.
        </div>
      </div>
    )
  }

  const isPaid = policy.paymentStatus === "Paid"

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h4 className="text-text-primary font-bold mb-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" /> Cargo Insurance
      </h4>
      <div className={`rounded-xl p-4 border ${isPaid ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-text-secondary text-xs">Premium</p>
          <p className="text-text-primary font-bold">₦{Number(policy.premium || 0).toLocaleString("en-NG")}</p>
        </div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-text-secondary text-xs">Policy No.</p>
          <p className="text-text-primary text-sm">{policy.policyNo || "—"}</p>
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-text-secondary text-xs">Payment Status</p>
          <p className={`text-sm font-medium ${isPaid ? "text-success" : "text-warning"}`}>{policy.paymentStatus || "Unknown"}</p>
        </div>

        {isPaid && policy.certificatePrintURL ? (
          <a
            href={policy.certificatePrintURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-success text-white py-2 rounded-lg font-medium text-sm hover:bg-success/90 transition-colors"
          >
            View Certificate <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : policy.paymentURL ? (
          <a
            href={policy.paymentURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-warning text-white py-2 rounded-lg font-medium text-sm hover:bg-warning/90 transition-colors"
          >
            Pay Premium <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  )
}

export default ShipmentInsuranceStatus
