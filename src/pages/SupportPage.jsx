import { useState } from "react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { Mail, MessageCircle, Instagram, ChevronDown, MessageSquare } from "lucide-react"

const FAQS = [
  {
    q: "How does payment work?",
    a: "Payments are staged, not released all at once. When you accept a bid, 5% is charged and credited to your carrier immediately. When you confirm pickup, 60% + a 5% platform fee releases. When you confirm delivery, the final 30% releases. Funds are always tied to a real milestone, never paid out in full upfront.",
  },
  {
    q: "What's the maximum I can bid above a shipment's estimated cost?",
    a: "Up to ₦300,000 above the shipper's estimated cost. You can also bid below the estimate if you want to undercut other carriers.",
  },
  {
    q: "Can I edit my bid after placing it?",
    a: "Yes, for 10 minutes after you place it. After that window closes, it locks in and can no longer be edited.",
  },
  {
    q: "What truck types are available?",
    a: "Flatbed, Container, and Refrigerated trucks, plus tonnage-based options from 10 to 60 tons (10/15/20/30/40/50/60 ton packers and trailers). Each option shows a reference photo when you're creating a shipment, so you can match it to what you actually need by sight, not just the label.",
  },
  {
    q: "How do I know which truck type to pick?",
    a: "Pick a truck that can contain your shipment, either by weight or by space — make sure its capacity covers your cargo's weight, or that it physically fits, whichever is the limiting factor for your load.",
  },
  {
    q: "Can I call my driver directly?",
    a: "Yes — once a shipper accepts a bid, a \"Call Driver\" option appears, using the phone number on file for whoever won the bid (trucker, driver, or fleet manager). Before a bid is accepted, phone numbers stay private between the two parties.",
  },
  {
    q: "What regions does Holage operate in?",
    a: "Nigeria-wide. Pickup and destination can be any state, matched down to the local government area.",
  },
  {
    q: "How do I earn as an Agent?",
    a: "Share your referral code with truckers, drivers, fleet managers, or shippers. The first time your invitee completes and confirms a shipment, you earn ₦3,000 (trucker/fleet manager referrals) or ₦300 (any other role) straight into your Bonus Wallet.",
  },
  {
    q: "Do drivers need to go through a Fleet Manager?",
    a: "Yes — drivers are onboarded by a Fleet Manager using that manager's driver code, and bid/get paid through the fleet. Independent operators sign up as a Trucker instead, which doesn't require a Fleet Manager.",
  },
  {
    q: "How do I correct a wrongly entered phone number?",
    a: "Open your Profile tab and edit your phone number directly — you'll need to confirm with your password. This matters especially if you're insuring a shipment, since our cargo insurance partner requires an exact 11-digit Nigerian number.",
  },
  {
    q: "What is cargo insurance and how do I add it?",
    a: "Optional Goods-in-Transit insurance that covers your cargo while it's in transit. You can add it once you accept a bid (not at shipment creation), since the real premium depends on the exact vehicle carrying your load. The shipper is always the insured party.",
  },
  {
    q: "What's the minimum withdrawal from my Bonus Wallet?",
    a: "₦10,000 for shippers, truckers, drivers, and fleet managers. Agents have a ₦30,000 minimum, reflecting typically larger referral reward volumes.",
  },
  {
    q: "Why do I need to verify my NIN/BVN or CAC?",
    a: "Every user verifies their identity before they can bid, ship, or withdraw — individuals with NIN/BVN, registered businesses with CAC. This keeps the platform trustworthy for everyone transacting on it.",
  },
  {
    q: "I have an issue with a specific shipment — what do I do?",
    a: "Log in and use the Complaints tab in your dashboard, linked to the shipment in question. Our team reviews and responds to every complaint submitted that way.",
  },
]

const FaqItem = ({ q, a, open, onToggle }) => {
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-text-primary font-semibold text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-text-secondary flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-text-secondary text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}

const SupportPage = () => {
  const { navigateTo } = useAppContext()
  // Accordion: only one FAQ open at a time — opening another closes whichever was open.
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header transparent />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-40 sm:pt-48 pb-10">

        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="text-xs font-medium tracking-widest uppercase text-accent mb-2">
            We're Here to Help
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            Support
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
            Answers to common questions, plus how to reach us directly if you need more.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Email Us</h3>
            <a href="mailto:info@holagehq.com" className="block text-white/70 text-xs hover:text-white transition-colors">
              info@holagehq.com
            </a>
            <a href="mailto:holagehq@gmail.com" className="block text-white/70 text-xs hover:text-white transition-colors">
              holagehq@gmail.com
            </a>
          </div>
          <a
            href="https://wa.me/2348135685212"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/15 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Chat on WhatsApp</h3>
            <p className="text-white/70 text-xs">+234 813 568 5212</p>
          </a>
          <a
            href="https://instagram.com/holagehq"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/15 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Follow Us</h3>
            <p className="text-white/70 text-xs">@holagehq</p>
          </a>
        </div>

        {/* FAQ — white card */}
        <div className="bg-card rounded-3xl shadow-2xl p-6 sm:p-10 mb-10">
          <h2 className="text-text-primary font-bold text-xl mb-5">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((item, index) => (
              <FaqItem
                key={item.q}
                {...item}
                open={openFaqIndex === index}
                onToggle={() => setOpenFaqIndex((prev) => (prev === index ? null : index))}
              />
            ))}
          </div>
        </div>

        {/* Shipment-specific issue callout */}
        <div className="bg-white/10 border border-white/15 rounded-2xl p-6 backdrop-blur-sm flex items-start gap-4 mb-10">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm mb-1">Have an issue with a specific shipment?</h3>
            <p className="text-white/70 text-xs leading-relaxed mb-3">
              Log in and use the Complaints tab in your dashboard — it's linked directly to the shipment in question, so our team has full context from the start.
            </p>
            <button
              onClick={() => navigateTo("login")}
              className="text-xs font-bold text-white bg-white/15 hover:bg-white/25 rounded-xl px-4 py-2 transition-colors"
            >
              Log In
            </button>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}

export default SupportPage
