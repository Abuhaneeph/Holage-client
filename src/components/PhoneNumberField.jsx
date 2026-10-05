import { useState } from "react"
import { Phone, Loader } from "lucide-react"
import { useToast } from "../context/ToastContext"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/**
 * Phone number display + correction form, shared across every role's Personal Information
 * card. Was previously set once at signup/KYC with no way to fix a typo — discovered when a
 * stored 12-digit number (one extra digit) silently blocked cargo insurance, since Tangerine
 * validates the insured party's phone is exactly 11 digits. Password-confirmed since for
 * drivers this also doubles as their login identifier.
 */
const PhoneNumberField = ({ phone, onUpdated }) => {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [password, setPassword] = useState("")
  const [updating, setUpdating] = useState(false)

  const startEditing = () => {
    setNewPhone(phone || "")
    setPassword("")
    setEditing(true)
  }

  const save = async () => {
    if (!/^\d{11}$/.test(newPhone)) {
      toast.error("Enter a valid 11-digit phone number")
      return
    }
    if (!password) {
      toast.error("Enter your password to confirm")
      return
    }
    setUpdating(true)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_BASE_URL}/kyc/phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone: newPhone, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Phone number updated successfully')
        onUpdated?.(newPhone)
        setEditing(false)
      } else {
        toast.error(data.message || 'Failed to update phone number')
      }
    } catch {
      toast.error('Error updating phone number')
    } finally {
      setUpdating(false)
    }
  }

  if (editing) {
    return (
      <div className="p-3 bg-muted/30 rounded-xl space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">New Phone Number</label>
          <input
            type="text"
            inputMode="numeric"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            maxLength="11"
            placeholder="Enter 11-digit phone number"
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Password (to confirm)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-text-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={updating}
            className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            disabled={updating}
            className="px-3 py-2 bg-muted text-text-primary rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-xl">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Phone className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-secondary text-sm mb-1">Phone Number</p>
        <p className="text-text-primary font-medium">{phone || "Not provided"}</p>
      </div>
      <button
        onClick={startEditing}
        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0 mt-1"
      >
        Edit
      </button>
    </div>
  )
}

export default PhoneNumberField
