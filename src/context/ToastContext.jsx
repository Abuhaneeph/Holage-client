import { createContext, useState, useContext } from "react"
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react"

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = "info", duration = 4000) => {
    const id = Date.now()
    const newToast = { id, message, type }
    
    setToasts(prev => [...prev, newToast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (message, duration) => showToast(message, "success", duration)
  const error = (message, duration) => showToast(message, "error", duration)
  const warning = (message, duration) => showToast(message, "warning", duration)
  const info = (message, duration) => showToast(message, "info", duration)

  const getIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5" />
      case "error": return <XCircle className="w-5 h-5" />
      case "warning": return <AlertCircle className="w-5 h-5" />
      case "info": return <Info className="w-5 h-5" />
      default: return <Info className="w-5 h-5" />
    }
  }

  const getStyles = (type) => {
    switch (type) {
      case "success": return "bg-success border-success text-white"
      case "error": return "bg-destructive border-destructive text-white"
      case "warning": return "bg-warning border-warning text-white"
      case "info": return "bg-primary border-primary text-white"
      default: return "bg-muted border-border text-text-primary"
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${getStyles(toast.type)} border-2 rounded-xl p-4 shadow-lg backdrop-blur-sm animate-slideIn flex items-start space-x-3`}
          >
            <div className="flex-shrink-0 mt-0.5 text-white">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-white">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-white hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

