import { useState } from "react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"
import { ArrowLeft, Smartphone, Globe } from "lucide-react"

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-lg font-semibold text-text mb-3 pb-2 border-b border-border">
      {title}
    </h2>
    <div className="text-text-secondary text-sm leading-relaxed space-y-3">
      {children}
    </div>
  </section>
)

const ROLES = [
  { value: "shipper", label: "Shipper" },
  { value: "trucker", label: "Trucker" },
  { value: "driver", label: "Driver (fleet-employed)" },
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "agent", label: "Agent" },
]

const DeleteAccountPage = () => {
  const { navigateTo, requestAccountDeletion } = useAppContext()
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "", reason: "", scope: "full_account" })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!form.fullName.trim() || (!form.email.trim() && !form.phone.trim())) {
      setError("Please provide your name and either an email or phone number.")
      return
    }

    setSubmitting(true)
    try {
      await requestAccountDeletion(form)
      setSubmitted(true)
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={() => navigateTo("landing")}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to Home
        </button>

        <div className="mb-10 pb-8 border-b border-border">
          <p className="text-xs font-medium tracking-widest uppercase text-primary mb-2">
            Account &amp; Data
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Delete Your Account
          </h1>
          <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
            You can permanently delete your Holage account and personal data at any time,
            whether or not you still have the app installed.
          </p>
        </div>

        <div className="space-y-10">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={16} className="text-primary" />
                <h3 className="font-medium text-text text-sm">Have the app installed?</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Open Holage → go to your <strong className="text-text font-medium">Profile</strong> tab →
                scroll down to <strong className="text-text font-medium">Delete KYC/Identity Data</strong> (keeps
                your account) or <strong className="text-text font-medium">Delete Account</strong> (everything).
                Both take effect immediately.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className="text-primary" />
                <h3 className="font-medium text-text text-sm">No app installed?</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Use the form below. We verify your identity against your account and process
                the request within <strong className="text-text font-medium">7 business days</strong>.
              </p>
            </div>
          </div>

          <Section title="What gets deleted">
            <p><strong className="text-text font-medium">Entire account:</strong> your name, email, phone number, password, KYC documents (ID, driver's licence, vehicle registration, utility bill), bank/payout details, and profile photo.</p>
            <p><strong className="text-text font-medium">KYC/identity data only:</strong> NIN, BVN, and uploaded identity documents/photo. Your login, wallet, and shipment history stay exactly as they are — you'll just need to re-submit KYC before bidding, shipping, or withdrawing again.</p>
          </Section>

          <Section title="What's retained, and why">
            <p>
              Nigerian financial regulations require us to keep transaction and shipment
              records even after an account is deleted. These records are kept but{" "}
              <strong className="text-text font-medium">disassociated from your identity</strong> —
              your name is replaced with "Deleted User" everywhere it appears in another user's
              shipment or payment history.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Transaction ledger entries (retained per financial recordkeeping requirements)</li>
              <li>Shipment records tied to a counterparty's own delivery history</li>
            </ul>
            <p>
              If you have a positive wallet balance, please withdraw it before requesting
              deletion — deletion does not trigger an automatic payout.
            </p>
          </Section>

          <Section title="Request deletion">
            {submitted ? (
              <div className="bg-success/10 border border-success/30 rounded-lg p-5 text-text">
                Your request has been received. We'll verify your account and process the
                deletion within 7 business days.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 not-prose">
                <div>
                  <label className="block text-xs font-medium text-text mb-2">What would you like deleted? *</label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 bg-surface border border-border rounded-lg p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="scope"
                        value="full_account"
                        checked={form.scope === "full_account"}
                        onChange={handleChange}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-text">
                        <strong className="font-medium">My entire account</strong>
                        <span className="block text-text-secondary text-xs mt-0.5">Profile, KYC documents, bank details, login — everything. Cannot be undone.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2.5 bg-surface border border-border rounded-lg p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="scope"
                        value="kyc_data"
                        checked={form.scope === "kyc_data"}
                        onChange={handleChange}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-text">
                        <strong className="font-medium">Just my KYC/identity data</strong>
                        <span className="block text-text-secondary text-xs mt-0.5">NIN, BVN, and uploaded documents/photo only. Your account and login stay active.</span>
                      </span>
                    </label>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text mb-1.5">Role</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Select role</option>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <p className="text-xs text-text-secondary">Provide at least one of email or phone — whichever is on your account.</p>
                <div>
                  <label className="block text-xs font-medium text-text mb-1.5">Reason (optional)</label>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                {error && <p className="text-sm text-error">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : form.scope === "kyc_data" ? "Request KYC/Identity Data Deletion" : "Request Account Deletion"}
                </button>
              </form>
            )}
          </Section>

          <div className="pt-8 border-t border-border text-xs text-text-secondary">
            <span>© 2026 Holage Technologies. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountPage
