"use client"

import { useState, useEffect } from "react"
import { 
  Truck, 
  Wallet,
  Package,
  User,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  DollarSign,
  Loader,
  LogOut,
  Upload,
  FileText,
  Camera
} from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { useToast } from "../context/ToastContext"

const TruckerDashboard = () => {
  const { user, logoutUser, navigateTo } = useAppContext()
  const toast = useToast()
  const [activeView, setActiveView] = useState("home")
  const [showBalance, setShowBalance] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [walletError, setWalletError] = useState("")
  const [kycCheckDone, setKycCheckDone] = useState(false)
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  
  // Documents state
  const [documents, setDocuments] = useState(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  
  // Check if user has completed KYC and fetch documents
  useEffect(() => {
    const checkKYC = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          navigateTo('login')
          return
        }
        
        const response = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        
        if (data.success) {
          setDocuments(data.documents)
          
          // If user hasn't filled basic KYC info, redirect to KYC page
          if (!data.documents.phone || !data.documents.address || !data.documents.nin) {
            navigateTo('kyc')
            return
          }
        }
        
        setKycCheckDone(true)
        // Fetch wallet
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
          const token = localStorage.getItem('authToken')
          const wr = await fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } })
          const wd = await wr.json()
          if (wr.ok && wd.wallet) {
            setWallet(wd.wallet)
            setWalletBalance(parseFloat(wd.wallet.balance || 0))
          } else {
            setWallet(null)
            setWalletError('Add your BVN in your KYC profile to unlock your Holage wallet.')
          }
          // Load transactions
          const tr = await fetch(`${API_BASE_URL}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
          const td = await tr.json()
          if (tr.ok && td.transactions) setTransactions(td.transactions)
        } catch (e) {
          setWallet(null)
          setWalletError('Add your BVN in your KYC profile to unlock your Holage wallet.')
        }
      } catch (error) {
        console.error('Error checking KYC status:', error)
        setKycCheckDone(true)
      }
    }
    
    checkKYC()
  }, [])

  // Handle document upload
  const handleDocumentUpload = async (documentType, file) => {
    if (!file) return
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    setUploadingDoc(documentType)
    try {
      const formData = new FormData()
      formData.append(documentType, file)
      
      // Add required fields from existing documents
      if (documents?.phone) formData.append('phone', documents.phone)
      if (documents?.address) formData.append('address', documents.address)
      if (documents?.nin) formData.append('nin', documents.nin)
      if (documents?.plateNumber) formData.append('plateNumber', documents.plateNumber)
      if (documents?.vehicleType) formData.append('vehicleType', documents.vehicleType)
      
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const data = await response.json()
      if (response.ok) {
        toast.success('Document uploaded successfully!')
        // Refresh documents
        const refreshResponse = await fetch(`${API_BASE_URL}/kyc/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setDocuments(refreshData.documents)
        }
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Error uploading document')
    } finally {
      setUploadingDoc(null)
    }
  }

  // Trigger file input
  const triggerFileUpload = (documentType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,application/pdf'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        handleDocumentUpload(documentType, file)
      }
    }
    input.click()
  }

  // Bank transfer: initiate
  const initiateBankTransfer = async () => {
    try {
      const amountNum = parseFloat(fundAmount)
      if (!amountNum || amountNum <= 0) {
        toast.error('Enter a valid amount')
        return
      }
      setFundLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const token = localStorage.getItem('authToken')
      const reference = `holage-ref-${Date.now()}`
      const resp = await fetch(`${API_BASE_URL}/wallet/korapay/charges/bank-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          account_name: user?.fullName || 'Holage User',
          amount: amountNum,
          currency: 'NGN',
          reference,
          customer: { name: user?.fullName || 'Holage User', email: user?.email || 'noreply@example.com' }
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || 'Failed to initiate')
      const bankAcc = data?.data?.bank_account || data?.data?.data?.bank_account || data?.data?.bank || null
      setFundAccount(bankAcc)
      setFundReference(reference)
      toast.success('Bank transfer created. Transfer to the account shown.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setFundLoading(false)
    }
  }

  // Bank transfer: confirm
  const confirmBankTransfer = async () => {
    if (!fundReference) { toast.error('No reference to confirm'); return }
    try {
      setFundLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const token = localStorage.getItem('authToken')
      const maxTries = 6
      let attempt = 0
      let success = false
      let lastErr = ''
      while (attempt < maxTries && !success) {
        const resp = await fetch(`${API_BASE_URL}/wallet/korapay/charges/${encodeURIComponent(fundReference)}/confirm`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await resp.json().catch(() => ({}))
        // Only accept 200 OK as success (202 is pending, 400 is failed)
        if (resp.status === 200) {
          success = true
          toast.success('Payment confirmed and wallet credited')
          try {
            const [wr, tr] = await Promise.all([
              fetch(`${API_BASE_URL}/wallet`, { headers: { 'Authorization': `Bearer ${token}` } }),
              fetch(`${API_BASE_URL}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
            ])
            const wd = await wr.json()
            const td = await tr.json()
            if (wr.ok && wd.wallet) {
              setWallet(wd.wallet)
              setWalletBalance(parseFloat(wd.wallet.balance || 0))
            }
            if (tr.ok && td.transactions) setTransactions(td.transactions)
          } catch {}
          setShowFundModal(false)
          setFundAccount(null)
          setFundReference("")
          setFundAmount("")
          break
        } else if (resp.status === 400) {
          // Final failure
          throw new Error(data?.message || 'Confirmation failed')
        } else {
          // 202 Accepted = pending, retry
          lastErr = data?.message || 'Still processing'
          await new Promise(r => setTimeout(r, 5000))
          attempt += 1
        }
      }
      if (!success) throw new Error(lastErr)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setFundLoading(false)
    }
  }

  // Mock data
  const activeLoads = [
    { id: "TL001", from: "Lagos", to: "Abuja", amount: 180000, status: "in_transit", weight: "2.5t" },
    { id: "TL002", from: "Kano", to: "PH", amount: 220000, status: "pickup_ready", weight: "1.8t" }
  ]

  const availableLoads = [
    { id: "AL001", from: "Ibadan", to: "Kaduna", amount: 200000, distance: "450km", weight: "3.2t" },
    { id: "AL002", from: "Benin", to: "Jos", amount: 165000, distance: "380km", weight: "2.1t" }
  ]

  if (!kycCheckDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Wallet Card - Always visible at top */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {documents?.profilePhoto ? (
              <img 
                src={documents.profilePhoto} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <p className="text-white/80 text-sm">Welcome</p>
              <p className="text-white font-bold text-lg">{user?.fullName?.split(' ')[0] || "Driver"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
            </button>
            <button 
              onClick={logoutUser}
              className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center hover:bg-error/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {wallet && (
          <div className="mt-6">
            <p className="text-white/80 text-sm mb-1">Wallet Balance</p>
            <p className="text-white text-3xl font-bold">
              {showBalance ? `₦${walletBalance.toLocaleString()}` : '₦ • • • • • •'}
            </p>
            <div className="mt-3 text-white/90 text-sm">
              <div>Account: <span className="font-semibold tracking-wider">{wallet.accountNumber}</span></div>
              <div>Name: <span className="font-semibold">{wallet.accountName}</span></div>
              <div>Bank: <span className="font-semibold">{wallet.bankName}</span></div>
            </div>
          </div>
        )}
        {!wallet && walletError && (
          <div className="mt-3 text-white/80 text-xs">{walletError}</div>
        )}
        {!wallet && (
          <div className="mt-6 bg-white/10 border border-white/20 rounded-2xl p-4 text-left">
            <p className="text-white font-semibold mb-2">Add your BVN to unlock your Holage wallet.</p>
            <p className="text-white/80 text-sm mb-3">
              Complete your BVN details in the KYC profile to generate your virtual account instantly.
            </p>
            <button
              onClick={() => navigateTo('kyc')}
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-colors"
            >
              Update BVN
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button 
            onClick={() => setShowFundModal(true)}
            disabled={!wallet}
            className={`backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3 ${
              !wallet
                ? "bg-white/10 opacity-60 cursor-not-allowed"
                : "bg-white/20 hover:bg-white/30 transition-colors"
            }`}
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-medium">Add Money</span>
          </button>
          <button 
            onClick={() => toast.info('Withdraw - coming soon!')}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/30 transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-medium">Withdraw</span>
          </button>
        </div>
      </div>

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-text-primary font-bold text-xl">Add Money (Bank Transfer)</h3>
              <button onClick={() => { if (!fundLoading) { setShowFundModal(false); setFundAccount(null); setFundReference(""); setFundAmount("") } }} className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-text-secondary rotate-45" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-text-primary font-medium mb-2">Amount (NGN)</label>
                <input type="number" min="100" step="1" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text-primary" placeholder="e.g., 1500" disabled={!!fundAccount || fundLoading} />
              </div>

              {!fundAccount ? (
                <button onClick={initiateBankTransfer} disabled={fundLoading} className="w-full bg-primary text-white py-3 rounded-xl font-semibold">
                  {fundLoading ? 'Creating...' : 'Generate Bank Details'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-text-secondary text-sm">Transfer to</p>
                    <p className="text-text-primary font-semibold tracking-wider">{fundAccount?.account_number || '------'}</p>
                    <p className="text-text-secondary text-sm">Bank: <span className="text-text-primary font-medium">{fundAccount?.bank_name || 'N/A'}</span></p>
                  </div>
                  <button onClick={confirmBankTransfer} disabled={fundLoading} className="w-full bg-success text-white py-3 rounded-xl font-semibold">
                    {fundLoading ? 'Confirming...' : 'I have paid - Confirm'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 mt-6">
        {activeView === "home" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-success to-success/80 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">Active Loads</p>
                <p className="text-white font-bold text-3xl">{activeLoads.length}</p>
              </div>

              <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-white/80 text-sm">This Month</p>
                <p className="text-white font-bold text-2xl">₦125k</p>
              </div>
            </div>

            {/* Active Loads */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold text-lg">Active Loads</h3>
                <span className="text-primary text-sm font-medium">See all</span>
              </div>
              
              {activeLoads.length > 0 ? (
                <div className="space-y-3">
                  {activeLoads.map((load) => (
                    <div key={load.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            load.status === 'in_transit' ? 'bg-primary/10' : 'bg-success/10'
                          }`}>
                            <Navigation className={`w-6 h-6 ${
                              load.status === 'in_transit' ? 'text-primary' : 'text-success'
                            }`} />
                          </div>
                          <div>
                            <p className="text-text-primary font-bold">{load.from} → {load.to}</p>
                            <p className="text-text-secondary text-sm">#{load.id} • {load.weight}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <p className="text-success font-bold text-lg">₦{load.amount.toLocaleString()}</p>
                        <button className="bg-primary text-white px-5 py-2 rounded-xl font-medium text-sm">
                          {load.status === 'in_transit' ? 'Track' : 'Start'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-2xl p-8 text-center">
                  <Truck className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                  <p className="text-text-secondary">No active loads</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "jobs" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Available Loads</h2>
            <p className="text-text-secondary">Find loads near you</p>
            
            {availableLoads.map((load) => (
              <div key={load.id} className="bg-card border-2 border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Package className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-text-primary font-bold text-lg">{load.from} → {load.to}</p>
                      <p className="text-text-secondary text-sm">#{load.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-success font-bold text-xl">₦{load.amount.toLocaleString()}</p>
                    <p className="text-text-secondary text-xs">{load.distance}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4 text-sm text-text-secondary">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{load.distance}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Package className="w-4 h-4" />
                    <span>{load.weight}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-muted text-text-secondary py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors">
                    Details
                  </button>
                  <button 
                    onClick={() => toast.success('Load accepted!')}
                    className="bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                  >
                    Accept Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === "wallet" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Wallet</h2>
            {!wallet && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-5">
                <p className="text-warning font-semibold mb-2">Your wallet isn&apos;t ready yet.</p>
                <p className="text-warning/90 text-sm mb-3">
                  Update your BVN details so we can provision your Holage wallet account.
                </p>
                <button
                  onClick={() => navigateTo('kyc')}
                  className="bg-warning text-white px-4 py-2 rounded-xl font-medium hover:bg-warning/90 transition-colors"
                >
                  Update BVN
                </button>
              </div>
            )}
            
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-text-secondary mb-2">Available Balance</p>
              <p className="text-text-primary font-bold text-4xl">₦{Number(walletBalance || 0).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => toast.info('Add money - coming soon!')}
                className="bg-primary text-white rounded-2xl p-6 flex flex-col items-center space-y-3"
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowDown className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold">Add Money</span>
              </button>
              
              <button
                onClick={() => toast.info('Withdraw - coming soon!')}
                className="bg-secondary text-white rounded-2xl p-6 flex flex-col items-center space-y-3"
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowUp className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold">Withdraw</span>
              </button>
            </div>

            <div>
              <h3 className="text-text-primary font-bold mb-3">Recent Transactions</h3>
              {transactions.length === 0 ? (
                <div className="bg-muted/30 rounded-2xl p-6 text-center text-text-secondary">No transactions yet</div>
              ) : (
              <div className="space-y-2">
                  {transactions.map((t) => (
                    <div key={t.id || t.reference} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${t.type === 'credit' ? 'bg-success/10' : 'bg-error/10'} rounded-full flex items-center justify-center`}>
                          {t.type === 'credit' ? <ArrowDown className="w-5 h-5 text-success" /> : <ArrowUp className="w-5 h-5 text-error" />}
                    </div>
                    <div>
                          <p className="text-text-primary font-medium">{t.description || (t.type === 'credit' ? 'Wallet Funding' : 'Wallet Debit')}</p>
                          <p className="text-text-secondary text-xs">Ref: {t.reference}</p>
                    </div>
                  </div>
                      <p className={`${t.type === 'credit' ? 'text-success' : 'text-error'} font-bold`}>
                        {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount || 0).toLocaleString()}
                      </p>
                </div>
                  ))}
                    </div>
              )}
            </div>
          </div>
        )}

        {activeView === "profile" && (
          <div className="space-y-4">
            <h2 className="text-text-primary font-bold text-2xl">Profile</h2>
            
            {/* Profile Info Card */}
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              {documents?.profilePhoto ? (
                <img 
                  src={documents.profilePhoto} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              <p className="text-text-primary font-bold text-xl">{user?.fullName || "Driver"}</p>
              <p className="text-text-secondary">{user?.email || ""}</p>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <p className="text-text-primary font-bold text-2xl">47</p>
                    <p className="text-text-secondary text-sm">Loads</p>
                  </div>
                  <div className="w-px h-10 bg-border"></div>
                  <div className="text-center">
                    <p className="text-text-primary font-bold text-2xl">4.8</p>
                    <p className="text-text-secondary text-sm">Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-text-primary font-bold text-lg mb-3">Personal Information</h3>
              
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-secondary">Phone Number</span>
                  <span className="text-text-primary font-medium">{documents?.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-secondary">Address</span>
                  <span className="text-text-primary font-medium text-right">{documents?.address || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-secondary">NIN</span>
                  <span className="text-text-primary font-medium">{documents?.nin || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-secondary">Plate Number</span>
                  <span className="text-text-primary font-medium">{documents?.plateNumber || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-text-secondary">Vehicle Type</span>
                  <span className="text-text-primary font-medium">{documents?.vehicleType || "Not provided"}</span>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h3 className="text-text-primary font-bold text-lg mb-3">My Documents</h3>
              
              {loadingDocs ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">Loading...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Profile Photo */}
                  <div className={`bg-card border-2 rounded-xl p-4 ${
                    documents?.profilePhoto ? 'border-success/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {documents?.profilePhoto ? (
                          <img 
                            src={documents.profilePhoto} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-lg object-cover"
                            onClick={() => window.open(documents.profilePhoto, '_blank')}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                            <Camera className="w-6 h-6 text-warning" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-bold">Profile Photo</p>
                          <p className="text-text-secondary text-sm">
                            {documents?.profilePhoto ? 'Uploaded ✓' : 'Not uploaded'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerFileUpload('profilePhoto')}
                        disabled={uploadingDoc === 'profilePhoto'}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                          documents?.profilePhoto 
                            ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                            : 'bg-primary text-white hover:bg-primary/90'
                        } disabled:opacity-50`}
                      >
                        {uploadingDoc === 'profilePhoto' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{documents?.profilePhoto ? 'Update' : 'Upload'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Driver's License */}
                  <div className={`bg-card border-2 rounded-xl p-4 ${
                    documents?.driverLicense ? 'border-success/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {documents?.driverLicense ? (
                          documents.driverLicense.toLowerCase().includes('.pdf') ? (
                            <div 
                              className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center cursor-pointer"
                              onClick={() => window.open(documents.driverLicense, '_blank')}
                            >
                              <FileText className="w-6 h-6 text-warning" />
                            </div>
                          ) : (
                            <img 
                              src={documents.driverLicense} 
                              alt="Driver's License" 
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                              onClick={() => window.open(documents.driverLicense, '_blank')}
                            />
                          )
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Truck className="w-6 h-6 text-text-secondary" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-bold">Driver's License</p>
                          <p className="text-text-secondary text-sm">
                            {documents?.driverLicense ? 'Uploaded ✓' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerFileUpload('driverLicense')}
                        disabled={uploadingDoc === 'driverLicense'}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                          documents?.driverLicense 
                            ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                            : 'bg-primary text-white hover:bg-primary/90'
                        } disabled:opacity-50`}
                      >
                        {uploadingDoc === 'driverLicense' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{documents?.driverLicense ? 'Update' : 'Upload'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Registration */}
                  <div className={`bg-card border-2 rounded-xl p-4 ${
                    documents?.vehicleReg ? 'border-success/30' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {documents?.vehicleReg ? (
                          documents.vehicleReg.toLowerCase().includes('.pdf') ? (
                            <div 
                              className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center cursor-pointer"
                              onClick={() => window.open(documents.vehicleReg, '_blank')}
                            >
                              <FileText className="w-6 h-6 text-accent" />
                            </div>
                          ) : (
                            <img 
                              src={documents.vehicleReg} 
                              alt="Vehicle Registration" 
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                              onClick={() => window.open(documents.vehicleReg, '_blank')}
                            />
                          )
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-text-secondary" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-bold">Vehicle Registration</p>
                          <p className="text-text-secondary text-sm">
                            {documents?.vehicleReg ? 'Uploaded ✓' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => triggerFileUpload('vehicleReg')}
                        disabled={uploadingDoc === 'vehicleReg'}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                          documents?.vehicleReg 
                            ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                            : 'bg-primary text-white hover:bg-primary/90'
                        } disabled:opacity-50`}
                      >
                        {uploadingDoc === 'vehicleReg' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">{documents?.vehicleReg ? 'Update' : 'Upload'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Logout hint */}
            <div className="bg-muted/30 rounded-xl p-4 text-center">
              <p className="text-text-secondary text-sm">
                To logout, tap the 🚪 button at the top right
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - BIG ICONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "home" ? "bg-primary/10" : ""
            }`}
          >
            <Truck className={`w-7 h-7 ${activeView === "home" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "home" ? "text-primary" : "text-text-secondary"}`}>
              Home
            </span>
          </button>

          <button
            onClick={() => setActiveView("jobs")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "jobs" ? "bg-primary/10" : ""
            }`}
          >
            <Package className={`w-7 h-7 ${activeView === "jobs" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "jobs" ? "text-primary" : "text-text-secondary"}`}>
              Find Jobs
            </span>
          </button>

          <button
            onClick={() => setActiveView("wallet")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "wallet" ? "bg-primary/10" : ""
            }`}
          >
            <Wallet className={`w-7 h-7 ${activeView === "wallet" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "wallet" ? "text-primary" : "text-text-secondary"}`}>
              Wallet
            </span>
          </button>

          <button
            onClick={() => setActiveView("profile")}
            className={`flex flex-col items-center space-y-1 py-2 rounded-xl transition-colors ${
              activeView === "profile" ? "bg-primary/10" : ""
            }`}
          >
            <User className={`w-7 h-7 ${activeView === "profile" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-xs font-medium ${activeView === "profile" ? "text-primary" : "text-text-secondary"}`}>
              Profile
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TruckerDashboard
