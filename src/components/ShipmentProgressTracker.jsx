import { CheckCircle } from "lucide-react"

const STEPS = [
  { key: "assigned", label: "Assigned" },
  { key: "enroute_pickup", label: "Enroute Pickup" },
  { key: "arrived_pickup", label: "Arrived at Pickup" },
  { key: "loading", label: "Loading" },
  { key: "loading_confirmed", label: "Loading Confirmation" },
  { key: "enroute_pod", label: "Enroute POD" },
  { key: "arrived_pod", label: "Arrived POD" },
  { key: "offloading_confirmed", label: "Offloading & Confirmation" },
  { key: "completed", label: "Trip Completed" }
]

const getStepIndex = (shipment) => {
  const {
    status,
    deliveryConfirmed,
    arrivedAtPickupAt,
    loadingStartedAt,
    loadingConfirmedAt,
    arrivedAtPodAt,
    offloadingConfirmedAt
  } = shipment

  if (deliveryConfirmed) return 8
  if (offloadingConfirmedAt || status === "delivered") return 7
  if (arrivedAtPodAt) return 6
  if (status === "in_transit") return 5
  if (loadingConfirmedAt || status === "picked_up") return 4
  if (loadingStartedAt) return 3
  if (arrivedAtPickupAt) return 2
  if (status === "picking_up") return 1
  if (status === "assigned") return 0
  return -1
}

/**
 * Granular horizontal step tracker for a shipment's full trip lifecycle:
 * Assigned -> Enroute Pickup -> Arrived at Pickup -> Loading -> Loading Confirmation ->
 * Enroute POD -> Arrived POD -> Offloading & Confirmation -> Trip Completed.
 *
 * The middle 5 steps (arrived pickup / loading / loading confirmed / arrived POD /
 * offloading confirmed) are additional granular checkpoints layered on top of the shipment's
 * coarse `status` field (assigned/picking_up/picked_up/in_transit/delivered) — they don't
 * replace it, they just give a finer-grained view for this tracker.
 */
export default function ShipmentProgressTracker({ shipment }) {
  if (shipment.status === "cancelled") {
    return (
      <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-center">
        <p className="text-error font-medium text-sm">Shipment Cancelled</p>
      </div>
    )
  }

  const currentIndex = getStepIndex(shipment)

  if (currentIndex < 0) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-center">
        <p className="text-warning font-medium text-sm">Waiting for a carrier to be assigned</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <style>{`
        @keyframes holage-progress-fill {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .holage-progress-fill-line {
          background-image: linear-gradient(
            90deg,
            #1e3a8a 0%,
            #5b7fd6 50%,
            #1e3a8a 100%
          );
          background-size: 200% 100%;
          animation: holage-progress-fill 1.6s linear infinite;
        }
        @keyframes holage-pulse-glow {
          0% { transform: scale(1); opacity: 0.55; }
          75%, 100% { transform: scale(2.1); opacity: 0; }
        }
        .holage-pulse-glow-ring {
          animation: holage-pulse-glow 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div className="flex items-start min-w-[860px] px-2 py-1">
        {STEPS.map((step, i) => {
          const isFirst = i === 0
          const isLast = i === STEPS.length - 1
          // The final step ("Trip Completed") is a destination, not a stage in progress —
          // once reached there's nothing left to animate toward, so treat it as done rather
          // than "current" (no pulsing glow / filling line on the last step).
          const isDone = i < currentIndex || (i === currentIndex && isLast)
          const isCurrent = i === currentIndex && !isLast
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                <div
                  className={`flex-1 h-0.5 ${
                    isFirst
                      ? "invisible"
                      : isDone
                      ? "bg-success"
                      : isCurrent
                      ? "holage-progress-fill-line rounded-full"
                      : "border-t border-dashed border-border"
                  }`}
                />
                <div className="relative w-7 h-7 flex-shrink-0">
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full bg-primary holage-pulse-glow-ring" />
                  )}
                  <div
                    className={`relative w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                      isDone
                        ? "bg-success text-white"
                        : isCurrent
                        ? "bg-primary text-white ring-4 ring-primary/20"
                        : "bg-muted text-text-secondary border-2 border-dashed border-border"
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                  </div>
                </div>
                <div className={`flex-1 h-0.5 ${isLast ? "invisible" : isDone ? "bg-success" : "border-t border-dashed border-border"}`} />
              </div>
              <p
                className={`text-[10px] text-center mt-2 px-1 leading-tight ${
                  isCurrent ? "text-primary font-semibold" : isDone ? "text-success font-medium" : "text-text-secondary"
                }`}
              >
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
