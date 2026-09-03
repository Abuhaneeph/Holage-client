import React, { useEffect, useState } from 'react'
import { X, FileText, Printer } from 'lucide-react'
import { apiFetch } from '../utils/api'

/**
 * Structured e-waybill (loading confirmation document) — consignor/consignee, carrier/vehicle,
 * cargo details, and the pickup POD as proof of loading. Fetched from
 * GET /api/pod/:shipmentId/ewaybill once pickup has been confirmed for the shipment.
 */
export default function EwaybillModal({ shipmentId, onClose }) {
  const [ewaybill, setEwaybill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch(`/pod/${shipmentId}/ewaybill`)
        if (cancelled) return
        if (res.ok) {
          setEwaybill(res.data.ewaybill)
        } else {
          setError(res.data?.message || 'Failed to load e-waybill')
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load e-waybill')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [shipmentId])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-2xl print:hidden">
          <h3 className="text-text-primary font-bold text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> E-Waybill
          </h3>
          <div className="flex items-center gap-2">
            {ewaybill && (
              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-primary/20"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-error/10 text-error rounded-xl p-4 text-sm">{error}</div>
          ) : ewaybill ? (
            <div className="space-y-6">
              <div className="text-center border-b border-border pb-4">
                <h2 className="text-2xl font-bold text-text-primary">Holage E-Waybill</h2>
                <p className="text-text-secondary text-sm mt-1 font-mono">{ewaybill.bookingReference}</p>
                <p className="text-text-secondary text-xs mt-1">
                  Issued {new Date(ewaybill.issuedAt).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-text-secondary text-xs font-semibold uppercase mb-2">Consignor (Shipper)</p>
                  <p className="text-text-primary font-medium">{ewaybill.consignor.name || '—'}</p>
                  <p className="text-text-secondary text-sm">{ewaybill.consignor.phone || '—'}</p>
                  <p className="text-text-secondary text-sm mt-1">Pickup: {ewaybill.consignor.pickupAddress || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-text-secondary text-xs font-semibold uppercase mb-2">Consignee</p>
                  <p className="text-text-secondary text-sm">Destination: {ewaybill.consignee.destinationAddress || '—'}</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-text-secondary text-xs font-semibold uppercase mb-2">Carrier</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {(ewaybill.carrier.fleetManagerName || ewaybill.carrier.truckerName) && (
                    <p className="text-text-primary">
                      {ewaybill.carrier.fleetManagerName ? 'Fleet Manager' : 'Trucker'}: {ewaybill.carrier.fleetManagerName || ewaybill.carrier.truckerName}
                    </p>
                  )}
                  {ewaybill.carrier.driverName && (
                    <p className="text-text-primary">Driver: {ewaybill.carrier.driverName} ({ewaybill.carrier.driverPhone || '—'})</p>
                  )}
                  {ewaybill.carrier.vehiclePlateNumber && (
                    <p className="text-text-primary">Vehicle: {ewaybill.carrier.vehiclePlateNumber} — {ewaybill.carrier.vehicleManufacturer} {ewaybill.carrier.vehicleType}</p>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-text-secondary text-xs font-semibold uppercase mb-2">Cargo</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-text-secondary text-xs">Type</p><p className="text-text-primary font-medium">{ewaybill.cargo.type}</p></div>
                  <div><p className="text-text-secondary text-xs">Weight</p><p className="text-text-primary font-medium">{ewaybill.cargo.weight}t</p></div>
                  <div><p className="text-text-secondary text-xs">Truck Type</p><p className="text-text-primary font-medium">{ewaybill.cargo.truckType}</p></div>
                  <div><p className="text-text-secondary text-xs">Insured</p><p className="text-text-primary font-medium">{ewaybill.cargo.insured ? 'Yes' : 'No'}</p></div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-text-secondary text-xs font-semibold uppercase mb-2">Loading Confirmation</p>
                <p className="text-text-secondary text-sm">Confirmed: {new Date(ewaybill.loadingConfirmation.confirmedAt).toLocaleString()}</p>
                {ewaybill.loadingConfirmation.signatureName && (
                  <p className="text-text-secondary text-sm">Signed by: {ewaybill.loadingConfirmation.signatureName}</p>
                )}
                {ewaybill.loadingConfirmation.address && (
                  <p className="text-text-secondary text-sm">Location: {ewaybill.loadingConfirmation.address}</p>
                )}
                {ewaybill.loadingConfirmation.photos?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {ewaybill.loadingConfirmation.photos.map((url, i) => (
                      <img key={i} src={url} alt={`Loading proof ${i + 1}`} className="w-full h-20 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
