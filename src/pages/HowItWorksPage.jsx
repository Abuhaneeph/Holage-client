import { useState } from "react"
import { useAppContext } from "../context/AppContext"
import Header from "../components/Header"
import Footer from "../components/Footer"
import {
  Package,
  Users,
  CheckCircle,
  Navigation,
  Truck,
  PackageCheck,
  Search,
  Send,
  Wallet,
  Star,
  UserPlus,
  Share2,
  Gift,
  Banknote,
  ShieldCheck,
  Lock,
  Shield,
  Phone,
} from "lucide-react"

const ROLES = [
  { key: "shipper", label: "Shipper", icon: Package },
  { key: "trucker", label: "Trucker / Fleet Manager", icon: Truck },
  { key: "driver", label: "Driver", icon: UserPlus },
  { key: "agent", label: "Agent", icon: Gift },
]

const IMG = {
  box: "/assets/how-it-works/box.jpg",
  cargoTruck: "/assets/how-it-works/cargo-truck.jpg",
  wallet: "/assets/how-it-works/wallet.jpg",
  moneyBag: "/assets/how-it-works/money-bag.jpg",
  star: "/assets/how-it-works/star.jpg",
  search: "/assets/how-it-works/search.jpg",
  team: "/assets/how-it-works/team.jpg",
  megaphone: "/assets/how-it-works/megaphone.jpg",
  mapPin: "/assets/how-it-works/map-pin.jpg",
}

const JOURNEYS = {
  shipper: [
    { icon: Package, title: "Post Your Shipment", desc: "Enter pickup and destination, cargo type, weight, and the truck type you need. Takes under a minute.", image: IMG.box },
    { icon: Users, title: "Receive Bids", desc: "Verified truckers and fleet managers compete for your load. Compare price, rating, and vehicle before deciding.", image: IMG.team },
    { icon: CheckCircle, title: "Accept & Unlock", desc: "Pick the best bid. 5% is charged instantly and credited to your carrier — they're locked in and heading to pickup. Add optional cargo insurance here.", badge: "+5% released to carrier", image: IMG.moneyBag },
    { icon: Navigation, title: "Track Live", desc: "Watch your shipment move in real time on the map, from pickup to destination.", image: IMG.mapPin },
    { icon: Truck, title: "Confirm Pickup", desc: "Your driver arrives and loads the cargo. Confirm pickup to release 60% + the 5% platform fee.", badge: "+60% released", image: IMG.cargoTruck },
    { icon: PackageCheck, title: "Confirm Delivery", desc: "Cargo arrives safely. Confirm delivery to release the final 30%, then rate your carrier.", badge: "+30% released · ⭐ Rate & Review", image: IMG.box },
  ],
  trucker: [
    { icon: Search, title: "Browse the Marketplace", desc: "See live shipments matching your truck type and route — no cold calls, no guesswork.", image: IMG.search },
    { icon: Send, title: "Place Your Bid", desc: "Quote your price — up to ₦300,000 above the base estimate. You can edit your bid for 10 minutes after posting.", image: IMG.megaphone },
    { icon: Wallet, title: "Get Accepted", desc: "The shipper accepts your bid — 5% lands in your wallet instantly, before you've even picked up.", badge: "+5% instant", image: IMG.moneyBag },
    { icon: Truck, title: "Pick Up & Go", desc: "Load the cargo and mark it picked up. 60% + the 5% platform fee releases to you right away.", badge: "+60% unlocked", image: IMG.cargoTruck },
    { icon: PackageCheck, title: "Deliver & Get Paid", desc: "Complete the delivery and mark it delivered. The final 30% releases immediately.", badge: "+30% unlocked", image: IMG.wallet },
    { icon: Star, title: "Earn Your Stars", desc: "The shipper rates you. A strong reputation wins you more bids over time.", image: IMG.star },
  ],
  driver: [
    { icon: UserPlus, title: "Join a Fleet", desc: "Get onboarded by your Fleet Manager using their driver code — you're now part of their operation.", image: IMG.team },
    { icon: Search, title: "Find Jobs", desc: "See the loads assigned to your fleet's trucks, matched to what you're driving.", image: IMG.search },
    { icon: Truck, title: "Drive & Deliver", desc: "Pick up, transport, and deliver safely. The same staged 5/60/30 payment flow applies — paid out through your Fleet Manager.", image: IMG.cargoTruck },
    { icon: Star, title: "Build Your Reputation", desc: "Every completed trip earns you a rating. Strong ratings help your whole fleet win more bids.", image: IMG.star },
  ],
  agent: [
    { icon: Share2, title: "Share Your Code", desc: "Hand your referral code to truckers, drivers, fleet managers, or shippers you know.", image: IMG.megaphone },
    { icon: UserPlus, title: "They Sign Up", desc: "New users register on Holage using your code.", image: IMG.team },
    { icon: PackageCheck, title: "They Complete a Job", desc: "Once your invitee finishes and confirms their very first shipment...", image: IMG.box },
    { icon: Gift, title: "You Get Paid", desc: "₦3,000 for referring a trucker or fleet manager, ₦300 for anyone else — credited straight to your Bonus Wallet.", badge: "+₦3,000 / +₦300", image: IMG.moneyBag },
    { icon: Banknote, title: "Cash Out", desc: "Withdraw from your Bonus Wallet once you hit ₦30,000 — agents have a higher threshold than other roles (₦10,000) to reflect typically larger reward volumes.", image: IMG.wallet },
  ],
}

const POWER_UPS = [
  { icon: ShieldCheck, title: "Identity Shield", desc: "Every user verifies their NIN/BVN (individuals) or CAC (registered businesses) before they can bid, ship, or withdraw." },
  { icon: Lock, title: "Secure Vault", desc: "Payments are staged and held in escrow — never released in full upfront, always tied to a real milestone (acceptance, pickup, delivery)." },
  { icon: Shield, title: "Cargo Shield", desc: "Optional Goods-in-Transit insurance covers your cargo in transit, underwritten live the moment a bid is accepted." },
  { icon: Phone, title: "Direct Line", desc: "Once a bid is accepted, call your driver directly from the app — no middleman, no waiting on messages." },
]

const RoleIcon = ({ icon: Icon, active }) => (
  <Icon className={`w-5 h-5 ${active ? "text-white" : "text-text-secondary"}`} />
)

const HowItWorksPage = () => {
  const { navigateToSignupWithRole } = useAppContext()
  const [activeRole, setActiveRole] = useState("shipper")
  const steps = JOURNEYS[activeRole]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header transparent />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-40 sm:pt-48 pb-10">

        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="text-xs font-medium tracking-widest uppercase text-accent mb-2">
            Your Journey on Holage
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            How Holage Works
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
            Every shipment is a journey with clear milestones — complete each one to unlock the next payout,
            badge, or reward. Pick your role below to see your path.
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {ROLES.map((role) => {
            const active = activeRole === role.key
            return (
              <button
                key={role.key}
                onClick={() => setActiveRole(role.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                  active
                    ? "bg-gradient-to-r from-secondary to-accent text-white shadow-xl scale-105"
                    : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/15"
                }`}
              >
                <RoleIcon icon={role.icon} active={active} />
                {role.label}
              </button>
            )
          })}
        </div>

        {/* Journey — white card */}
        <div className="bg-card rounded-3xl shadow-2xl p-6 sm:p-10 mb-10">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border hidden sm:block" />

            <div className="space-y-8">
              {steps.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="relative flex gap-5">
                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 pt-1 flex flex-row items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-primary/60 uppercase tracking-wide">Level {i + 1}</span>
                        </div>
                        <h3 className="text-text-primary font-bold text-lg mb-1">{step.title}</h3>
                        <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                        {step.badge && (
                          <span className="inline-block mt-2 text-xs font-bold text-success bg-success/10 border border-success/20 rounded-full px-3 py-1">
                            🏆 {step.badge}
                          </span>
                        )}
                      </div>
                      {step.image && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-border bg-surface flex-shrink-0 self-center overflow-hidden">
                          <img
                            src={step.image}
                            alt=""
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Trust & Safety — Power-ups */}
        <div className="mb-10">
          <h2 className="text-white font-bold text-2xl text-center mb-2">Power-Ups Built In</h2>
          <p className="text-white/70 text-sm text-center mb-6 max-w-lg mx-auto">
            Every journey on Holage comes with these protections — on by default, no extra steps.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {POWER_UPS.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title} className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">{p.title}</h3>
                  <p className="text-white/70 text-xs leading-relaxed">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-card rounded-3xl shadow-2xl p-8 text-center">
          <h2 className="text-text-primary font-bold text-2xl mb-2">Ready to start your journey?</h2>
          <p className="text-text-secondary text-sm mb-6">Join as whichever role fits you — switch anytime.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigateToSignupWithRole("shipper")}
              className="bg-gradient-to-r from-secondary to-accent text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity"
            >
              Ship Your Goods
            </button>
            <button
              onClick={() => navigateToSignupWithRole("trucker")}
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity"
            >
              Drive & Earn
            </button>
            <button
              onClick={() => navigateToSignupWithRole("agent")}
              className="border-2 border-primary/30 text-primary px-6 py-3 rounded-2xl font-bold hover:bg-primary/5 transition-colors"
            >
              Register as an Agent
            </button>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}

export default HowItWorksPage
