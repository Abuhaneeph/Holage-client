import Header from "../components/Header"
import Footer from "../components/Footer"

const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-8">
    <h2 className="text-lg font-semibold text-text mb-3 pb-2 border-b border-border">
      {title}
    </h2>
    <div className="text-text-secondary text-sm leading-relaxed space-y-3">
      {children}
    </div>
  </section>
)

const TOCLink = ({ href, children }) => (
  <a
    href={href}
    className="block text-sm text-text-secondary hover:text-primary transition-colors py-1 pl-3 border-l-2 border-border hover:border-primary"
  >
    {children}
  </a>
)

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <Header transparent />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-40 sm:pt-48 pb-10">

        {/* Page header */}
        <div className="mb-10 pb-8 border-b border-white/10">
          <p className="text-xs font-medium tracking-widest uppercase text-accent mb-2">
            Legal Document
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <div className="flex flex-wrap gap-4 text-xs text-white/60">
            <span>Effective 15 September 2026</span>
            <span>·</span>
            <span>Last updated 15 September 2026</span>
            <span>·</span>
            <span>Version 1.0</span>
          </div>
          <p className="mt-4 text-sm text-white/70 max-w-2xl leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of the Holage
            platform, operated by Holage Africa Limited ("Holage", "we", "us", or "our").
            By creating an account or using Holage, you agree to be bound by these Terms.
          </p>
        </div>

        <div className="bg-card rounded-3xl shadow-2xl p-6 sm:p-10">
        <div className="flex gap-12 items-start">

          {/* Sidebar TOC — hidden on mobile */}
          <nav className="hidden lg:block w-52 shrink-0 sticky top-8">
            <p className="text-xs font-medium tracking-widest uppercase text-text-secondary mb-3">
              Contents
            </p>
            <div className="space-y-0.5">
              <TOCLink href="#the-platform">The Platform</TOCLink>
              <TOCLink href="#accounts-verification">Accounts &amp; Verification</TOCLink>
              <TOCLink href="#shipper-terms">Shipper Terms</TOCLink>
              <TOCLink href="#carrier-terms">Trucker, Driver &amp; Fleet Manager Terms</TOCLink>
              <TOCLink href="#agent-terms">Agent Referral Terms</TOCLink>
              <TOCLink href="#bidding">Bidding</TOCLink>
              <TOCLink href="#payments">Payments &amp; the Staged Wallet</TOCLink>
              <TOCLink href="#insurance">Cargo Insurance</TOCLink>
              <TOCLink href="#ratings-complaints">Ratings &amp; Complaints</TOCLink>
              <TOCLink href="#prohibited-conduct">Prohibited Conduct</TOCLink>
              <TOCLink href="#liability">Liability &amp; Disclaimers</TOCLink>
              <TOCLink href="#termination">Suspension &amp; Termination</TOCLink>
              <TOCLink href="#governing-law">Governing Law</TOCLink>
              <TOCLink href="#changes">Changes to These Terms</TOCLink>
              <TOCLink href="#contact">Contact Us</TOCLink>
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-10">

            <Section id="the-platform" title="1. The Platform">
              <p>
                Holage is a marketplace that connects shippers who need goods transported with
                independent truckers, fleet managers, and the drivers they employ, across Nigeria.
                Holage is not a carrier and does not itself transport goods — we provide the
                platform, matching, payment, and verification infrastructure that lets shippers
                and carriers transact with each other directly.
              </p>
              <p>
                Agents may also register to refer new users to the platform in exchange for a
                referral reward, as described in Section 5.
              </p>
            </Section>

            <Section id="accounts-verification" title="2. Accounts &amp; Verification">
              <ul className="list-disc pl-5 space-y-2">
                <li>You must provide accurate, current information when creating your account and keep it up to date, including your phone number.</li>
                <li>Every user must complete identity verification before bidding, shipping, or withdrawing funds — individuals via NIN/BVN, registered businesses via CAC.</li>
                <li>Drivers are onboarded by a fleet manager using that fleet manager's driver code and operate under the fleet manager's account; independent operators register as a Trucker instead.</li>
                <li>You are responsible for all activity on your account and for keeping your login credentials confidential.</li>
                <li>We may suspend or decline to verify an account if the information provided appears false, incomplete, or fraudulent.</li>
              </ul>
            </Section>

            <Section id="shipper-terms" title="3. Shipper Terms">
              <ul className="list-disc pl-5 space-y-2">
                <li>You are responsible for accurately describing your shipment — cargo type, weight, dimensions, and pickup/destination — and for selecting a truck type genuinely able to carry it, by weight or by space, whichever is the limiting factor.</li>
                <li>You may not list cargo that is illegal, hazardous beyond what you disclose, or otherwise prohibited under Nigerian law.</li>
                <li>Accepting a bid creates a binding arrangement with that carrier for the shipment, subject to the staged payment terms in Section 6.</li>
                <li>You must be present or reasonably reachable to confirm pickup and delivery milestones in the app, as these confirmations release payment to your carrier.</li>
              </ul>
            </Section>

            <Section id="carrier-terms" title="4. Trucker, Driver &amp; Fleet Manager Terms">
              <ul className="list-disc pl-5 space-y-2">
                <li>Truckers, fleet managers, and drivers must hold valid vehicle documentation and, where applicable, a valid driver's licence for the vehicle class being operated.</li>
                <li>Bids you place are offers to carry out the shipment at the quoted price; once a shipper accepts, you are committed to completing the job in line with the agreed route and timeline.</li>
                <li>Fleet managers are responsible for the conduct of drivers operating under their fleet code, including safe handling of cargo and accurate use of the app during a trip.</li>
                <li>Cargo must be handled with reasonable care; damage caused by your negligence or misconduct may be deducted from amounts owed to you or pursued separately by the shipper.</li>
              </ul>
            </Section>

            <Section id="agent-terms" title="5. Agent Referral Terms">
              <ul className="list-disc pl-5 space-y-2">
                <li>Agents earn a referral reward the first time a person they referred completes and confirms their first shipment on the platform: ₦3,000 for a trucker or fleet manager referral, ₦300 for any other role.</li>
                <li>Referral rewards are credited to the agent's Bonus Wallet and are subject to the minimum withdrawal thresholds in Section 6.</li>
                <li>Self-referrals, fake accounts, or any attempt to manufacture referral rewards without a genuine new user are prohibited and may result in forfeiture of rewards and account suspension.</li>
              </ul>
            </Section>

            <Section id="bidding" title="6. Bidding">
              <ul className="list-disc pl-5 space-y-2">
                <li>Carriers may bid up to ₦300,000 above a shipment's estimated cost, or below it to undercut other bids.</li>
                <li>A bid can be edited for 10 minutes after it is placed; after that window it locks in and can no longer be changed.</li>
                <li>A shipper accepting a bid is final for that shipment — bids cannot be revoked by the shipper after acceptance except through the dispute process in Section 9.</li>
              </ul>
            </Section>

            <Section id="payments" title="7. Payments &amp; the Staged Wallet">
              <p>Payments for a shipment are staged and released against real milestones, never paid out in full upfront:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-text font-medium">On acceptance:</strong> 5% of the agreed price is charged and credited to the carrier immediately.</li>
                <li><strong className="text-text font-medium">On pickup confirmation:</strong> 60% of the agreed price, plus a 5% platform fee, is released.</li>
                <li><strong className="text-text font-medium">On delivery confirmation:</strong> the final 30% is released.</li>
              </ul>
              <p className="mt-3">
                All payment processing is handled by Paystack. Bonus Wallet balances (from agent
                referrals or other platform rewards) can be withdrawn once they reach ₦10,000 for
                shippers, truckers, drivers, and fleet managers, or ₦30,000 for agents.
              </p>
            </Section>

            <Section id="insurance" title="8. Cargo Insurance">
              <p>
                Optional Goods-in-Transit insurance can be added once a bid is accepted, since the
                premium depends on the specific vehicle carrying the load. The shipper is always
                the insured party. Insurance is underwritten by our third-party insurance partner,
                and claims are subject to that partner's own policy terms.
              </p>
            </Section>

            <Section id="ratings-complaints" title="9. Ratings &amp; Complaints">
              <p>
                After each completed shipment, shippers and carriers may rate one another. Ratings
                contribute to a user's reliability score and visibility on the platform. If an issue
                arises on a specific shipment, use the Complaints tab in your dashboard, linked
                directly to that shipment — our team reviews and responds to every complaint
                submitted this way.
              </p>
            </Section>

            <Section id="prohibited-conduct" title="10. Prohibited Conduct">
              <ul className="list-disc pl-5 space-y-2">
                <li>Circumventing the platform to transact directly with a counterparty you met on Holage, to avoid platform fees.</li>
                <li>Submitting false shipment, vehicle, or identity information.</li>
                <li>Harassing, threatening, or discriminating against another user.</li>
                <li>Attempting to manipulate ratings, referrals, or bids through fake accounts or collusion.</li>
                <li>Using the platform to transport illegal goods or goods you do not have the right to ship.</li>
              </ul>
              <p>Violating these Terms may result in warnings, suspension, or permanent termination of your account at our discretion.</p>
            </Section>

            <Section id="liability" title="11. Liability &amp; Disclaimers">
              <p>
                Holage provides the marketplace, matching, payment, and tracking infrastructure
                connecting shippers and carriers. We are not a party to the contract of carriage
                between a shipper and a carrier, and we do not guarantee the condition, timeliness,
                or safety of any shipment beyond the staged-payment and insurance mechanisms
                described above. To the fullest extent permitted by Nigerian law, Holage's
                liability for any claim arising from use of the platform is limited to the
                platform fees paid on the shipment giving rise to that claim.
              </p>
            </Section>

            <Section id="termination" title="12. Suspension &amp; Termination">
              <p>
                You may stop using Holage at any time and request account deletion as described on
                our Delete Account page. We may suspend or terminate your account if you violate
                these Terms, provide false information, or engage in conduct that harms other
                users or the platform. Obligations relating to completed shipments, outstanding
                payments, or ongoing disputes survive termination.
              </p>
            </Section>

            <Section id="governing-law" title="13. Governing Law">
              <p>
                These Terms are governed by the laws of the Federal Republic of Nigeria. Any
                dispute arising from these Terms or your use of Holage that cannot be resolved
                informally will be subject to the exclusive jurisdiction of the Nigerian courts.
              </p>
            </Section>

            <Section id="changes" title="14. Changes to These Terms">
              <p>
                We may update these Terms from time to time. When we make material changes, we
                will notify you via an in-app notice or email at least 14 days before the changes
                take effect. The "Last updated" date above reflects the most recent revision.
                Continued use of Holage after the effective date constitutes acceptance of the
                updated Terms.
              </p>
            </Section>

            <Section id="contact" title="15. Contact Us">
              <p>For questions about these Terms, contact us at:</p>
              <div className="mt-3 bg-surface border border-border rounded-lg p-5 inline-block">
                <p className="font-medium text-text">Holage Africa Limited</p>
                <p className="mt-1">
                  Email:{" "}
                  <a
                    href="mailto:info@holagehq.com"
                    className="text-primary hover:underline font-medium"
                  >
                    info@holagehq.com
                  </a>
                  {" "}or{" "}
                  <a
                    href="mailto:holagehq@gmail.com"
                    className="text-primary hover:underline font-medium"
                  >
                    holagehq@gmail.com
                  </a>
                </p>
              </div>
            </Section>

            {/* Footer */}
            <div className="pt-8 border-t border-border space-y-2 text-xs text-text-secondary">
              <div className="flex flex-wrap justify-between gap-3">
                <span>© 2026 Holage Africa Limited. All rights reserved.</span>
              </div>
              <p>3, Katako, Mallam Kure St, Jos, Plateau State, Nigeria</p>
            </div>

          </div>
        </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default TermsOfServicePage
