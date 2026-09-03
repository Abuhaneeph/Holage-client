import { X } from "lucide-react"

/**
 * Shared "Are you sure?" confirmation modal — replaces the native window.confirm()
 * calls scattered across the dashboards with one consistently-styled component, and
 * covers actions (logout, notification delete, etc.) that previously fired with no
 * confirmation at all.
 */
const ConfirmModal = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-background rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-text-primary font-bold text-lg">{title}</h3>
          <button type="button" onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-muted/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {message && <p className="text-text-secondary text-sm">{message}</p>}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border text-text-primary font-semibold text-sm rounded-xl py-2.5 hover:bg-muted/50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 font-semibold text-sm rounded-xl py-2.5 text-white transition-colors ${
              destructive ? "bg-error hover:bg-error/90" : "bg-secondary hover:bg-accent"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
