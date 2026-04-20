"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { 
    Loader2, ShieldCheck, Calendar, CreditCard, 
    Zap, CheckCircle2, AlertCircle, ArrowRight,
    Sparkles, Info, Star, Clock, UserCheck, Layout, Gift, 
    ShoppingCart, X, Check, Mail, Phone, Building2
} from "lucide-react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import businessService from "@/services/businessService"
import creditService from "@/services/creditService"
import { cn } from "@/lib/utils"

interface Plan {
    plan_id: string
    name: string
    description?: string
    price: number
    credits_offered: number
    validity_days: number
    deduction_value: number
    plan_category: string
    status: string
    total_messages?: number
    effective_price?: string
}

interface PlanData {
    plan: Plan | null
    plan_expiry: string | null
    credits_remaining: number
    status: "active" | "expired" | "no_plan"
    is_active: boolean
    whatsapp_mode?: string
    assigned_by_name?: string
    assigned_by_role?: string
    credits_allocated?: number
    credits_used?: number
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

import { usePlans } from "@/hooks/usePlans"

export default function PlansPage() {
    const router = useRouter()
    const [data, setData] = useState<PlanData | null>(null)
    const { plans: availablePlansHook, isLoading: isCatalogLoading, refresh: refreshCatalog } = usePlans('BUSINESS')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Checkout State
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showCheckoutModal, setShowCheckoutModal] = useState(false)
    const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'initiating' | 'paying' | 'verifying' | 'success' | 'error'>('idle')
    const [checkoutMessage, setCheckoutMessage] = useState("")
    const [isMounted, setIsMounted] = useState(false)
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: ""
    })

    // Map hook plans to local Plan interface if needed, or just use as is
    const availablePlans = (availablePlansHook || []).map(p => {
        const price = parseFloat(p.price.replace(/[^\d.]/g, ''))
        const credits = parseInt(p.credits.replace(/[^\d]/g, ''))
        const rate = parseFloat(p.rate.replace(/[^\d.]/g, ''))
        const total_messages = Math.floor(credits / (rate || 1))
        const effective_price = total_messages > 0 ? (price / total_messages).toFixed(2) : "0.00"

        return {
            plan_id: p.plan_id,
            name: p.name,
            price: price,
            credits_offered: credits,
            validity_days: parseInt(p.validity.replace(/[^\d]/g, '')),
            deduction_value: rate,
            plan_category: p.category.toUpperCase(),
            status: 'active',
            total_messages: total_messages,
            effective_price: effective_price
        }
    })

    const loadData = async () => {
        try {
            const token = localStorage.getItem("token")
            if (!token) { router.push("/login"); return }
            
            const planInfo = await businessService.getMyPlan(token)
            
            // Only update data if plan is properly validated and active
            if (planInfo.plan && planInfo.plan.status === 'active') {
                setData(planInfo)
            } else if (planInfo.plan && planInfo.plan.status === 'pending') {
                // Plan exists but pending validation - don't show as active
                console.log('⏳ Plan is pending validation:', planInfo.plan)
                setData({
                    ...planInfo,
                    plan: { ...planInfo.plan, status: 'pending' }
                })
            } else {
                setData(planInfo)
            }
        } catch (err: any) {
            console.error("Critical page error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setIsMounted(true)
        loadData()
    }, [router])

    useEffect(() => {
        if (!isCatalogLoading) {
            loadData()
        }
    }, [isCatalogLoading])

    const handlePurchaseInitiate = (plan: Plan) => {
        setSelectedPlan(plan)
        setShowCheckoutModal(true)
        setCheckoutStatus('idle')
    }

    const handlePayment = async () => {
        if (!selectedPlan) return
        if (!formData.name || !formData.email || !formData.mobile) {
            setCheckoutStatus('error')
            setCheckoutMessage("Please fill in all contact details.")
            return
        }

        setCheckoutStatus('initiating')
        setCheckoutMessage("Preparing your order...")

        try {
            const token = localStorage.getItem("token")
            if (!token) { router.push("/login"); return }

            const payload = {
                plan_name: selectedPlan.name,
                credits: selectedPlan.credits_offered,
                price: selectedPlan.price
            }

            const response = await creditService.initiatePayment(payload, token)

            if (response.success && response.razorpay_order_id) {
                setCheckoutStatus('paying')
                setCheckoutMessage("Waiting for payment...")

                const options = {
                    key: response.key,
                    amount: response.amount,
                    currency: response.currency,
                    name: "Messages Platform",
                    description: `${selectedPlan.name} Plan`,
                    order_id: response.razorpay_order_id,
                    handler: async function (paymentResponse: any) {
                        try {
                            setCheckoutStatus('verifying')
                            setCheckoutMessage("Verifying your payment...")
                            
                            const verifyResult = await creditService.verifyPayment({
                                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                razorpay_order_id: paymentResponse.razorpay_order_id,
                                razorpay_signature: paymentResponse.razorpay_signature
                            }, token)

                            if (verifyResult.success) {
                                setCheckoutStatus('success')
                                setCheckoutMessage("Plan purchased successfully! Please wait while we validate your plan...")
                                
                                // Wait a moment before refreshing to allow backend validation
                                setTimeout(async () => {
                                    await loadData() // Refresh dashboard data
                                    setTimeout(() => setShowCheckoutModal(false), 2000)
                                }, 2000)
                            } else {
                                setCheckoutStatus('error')
                                setCheckoutMessage("Payment verification failed. Please contact support.")
                            }
                        } catch (err) {
                            setCheckoutStatus('error')
                            setCheckoutMessage("Verification error. Please retry.")
                        }
                    },
                    prefill: {
                        name: formData.name,
                        email: formData.email,
                        contact: formData.mobile
                    },
                    modal: {
                        ondismiss: function() {
                            setCheckoutStatus('idle')
                        }
                    },
                    theme: { color: "#14b8a6" }
                }

                const rzp = new window.Razorpay(options)
                rzp.open()
            } else {
                setCheckoutStatus('error')
                setCheckoutMessage("Failed to initiate payment gateway.")
            }
        } catch (err: any) {
            setCheckoutStatus('error')
            setCheckoutMessage(err.response?.data?.detail || "Purchase failed. Please try again.")
        }
    }

    if (isLoading) return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Fetching plan catalog...</p>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-6">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-slate-600 font-medium">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    )

    const currentPlan = data?.plan
    const expiryDate = data?.plan_expiry ? new Date(data.plan_expiry) : null
    const daysRemaining = expiryDate 
        ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null

    return (
        <div className="max-w-6xl mx-auto space-y-8 page-enter py-4 pb-20">
            <Script 
                src="https://checkout.razorpay.com/v1/checkout.js" 
                strategy="afterInteractive" 
            />
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-teal-600">Plan Management</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Subscription & Plans</h1>
                    <p className="text-slate-500 mt-2 font-medium">View your active subscription and upgrade comfortably from here.</p>
                </div>
                
                {data && (
                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <CreditCard className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Current Balance</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter">{(data.credits_remaining || 0).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 1: My Active Plan */}
            <div className="space-y-4">
                <div className="section-divider">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 bg-white px-4">Currently Active</span>
                </div>

                {!currentPlan ? (
                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-dashed border-slate-200 text-center space-y-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <Layout className="w-6 h-6 text-slate-300" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">No Active Plan Found</h2>
                        <p className="text-slate-500 text-xs max-w-sm mx-auto font-medium">
                            You don't have an active plan assigned. Check out available options below to get started.
                        </p>
                    </div>
                ) : currentPlan.status === 'pending' ? (
                    <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-200 text-center space-y-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Plan Pending Validation</h2>
                        <p className="text-slate-500 text-xs max-w-sm mx-auto font-medium">
                            Your plan purchase is being validated. This usually takes a few minutes.
                        </p>
                        <div className="mt-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                Validating...
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Hero Plan Card */}
                        <div className="lg:col-span-2">
                            <div className="relative rounded-[2.5rem] bg-slate-900 p-1 overflow-hidden shadow-2xl shadow-teal-900/10 group h-full">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-teal-400/30 transition-all duration-500" />
                                <div className="relative h-full bg-slate-900/50 backdrop-blur-xl rounded-[2.25rem] p-6 md:p-8 flex flex-col border border-white/5">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">Current Plan</span>
                                            </div>
                                            <h2 className="text-4xl font-black text-white tracking-tighter mb-2">{currentPlan.name}</h2>
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-teal-400" />
                                                <p className="text-white/40 text-sm font-medium">Assigned by <span className="text-teal-400/80 font-bold">{data?.assigned_by_name || 'Administrator'}</span></p>
                                            </div>
                                        </div>
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                            <Star className="w-6 h-6 text-teal-400 fill-teal-400" />
                                        </div>
                                    </div>

                                    {/* Account Metadata - Moved Inside */}
                                    <div className="mb-10 space-y-4">
                                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Account Metadata</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                                    <Calendar className="w-4 h-4 text-teal-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Account Expiry</p>
                                                    <p className="text-white text-sm font-bold font-mono">
                                                        {expiryDate ? expiryDate.toISOString().replace('T', ' ').substring(0, 19) : 'Lifetime'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto grid grid-cols-2 md:grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono"><Clock className="w-3 h-3" /> Expiry Date</p>
                                            <p className="text-white text-lg font-bold font-mono">
                                                {expiryDate ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                                            </p>
                                            {daysRemaining !== null && daysRemaining > 0 && <p className="text-teal-400/80 text-[11px] font-bold">{daysRemaining} days left</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono"><Zap className="w-3 h-3" /> Net Rate</p>
                                            <p className="text-white text-lg font-bold font-mono">
                                                ₹{(currentPlan.price / (currentPlan.credits_offered / (currentPlan.deduction_value || 1))).toFixed(2)}/msg
                                            </p>
                                            <p className="text-teal-400/80 text-[11px] font-bold whitespace-nowrap uppercase tracking-tighter">Effective Cost</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono"><UserCheck className="w-3 h-3" /> Unit Cost</p>
                                            <p className="text-white text-lg font-bold font-mono">{currentPlan.deduction_value.toFixed(2)} cr/msg</p>
                                            <p className="text-white/40 text-[11px] font-medium whitespace-nowrap">Deduction Rate</p>
                                        </div>
                                        <div className="col-span-2 md:col-span-1 space-y-1">
                                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono"><ShieldCheck className="w-3 h-3" /> Plan Type</p>
                                            <p className="text-white text-lg font-bold uppercase tracking-tight">{currentPlan.plan_category}</p>
                                            <div className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 inline-block text-[9px] font-bold">ACTIVE</div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Usage Box */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-3xl bg-teal-50 flex items-center justify-center mb-6">
                                <CreditCard className="w-7 h-7 text-teal-600" />
                            </div>
                             <h3 className="text-lg font-bold text-slate-900 mb-1 whitespace-nowrap uppercase tracking-tight">Credits Remaining</h3>
                            <p className="text-slate-500 text-xs mb-6 font-medium">Available Message Units</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                {data?.credits_remaining?.toLocaleString() || '0'} / {data?.credits_allocated?.toLocaleString() || currentPlan.credits_offered.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-black text-teal-600 mt-1 tracking-[0.2em] uppercase opacity-80">Remaining / Total</p>
                            
                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-10 overflow-hidden">
                                <div 
                                    className="h-full bg-teal-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                                    style={{ width: `${Math.min(100, ((data?.credits_remaining || 0) / currentPlan.credits_offered) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between w-full mt-3 px-1 text-[11px] font-bold text-slate-400">
                                <span>{(((data?.credits_remaining || 0) / (currentPlan.credits_offered || 1)) * 100).toFixed(1)}% Left</span>
                                <span>{(data?.credits_remaining || 0).toLocaleString()} Left</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 2: All Available Plans */}
            <div className="space-y-8">
                <div className="section-divider">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 bg-white px-4">Available Plans</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availablePlans.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-slate-400 text-sm">No business plans currently available in the catalog.</div>
                    ) : (
                        availablePlans.map((plan) => {
                            const isCurrent = plan.plan_id === currentPlan?.plan_id
                            
                            return (
                                <div 
                                    key={plan.plan_id}
                                    className={cn(
                                        "bg-white rounded-[2rem] border p-7 transition-all duration-300 relative group flex flex-col",
                                        isCurrent ? "border-teal-500 ring-4 ring-teal-500/5 shadow-xl scale-[1.02]" : "border-slate-100 hover:border-slate-200 hover:shadow-lg"
                                    )}
                                >
                                    {isCurrent && (
                                        <div className="absolute top-4 right-4 px-2 py-1 bg-teal-500 text-white text-[9px] font-black rounded-lg shadow-sm">CURRENT</div>
                                    )}

                                    <div className="mb-6">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{plan.plan_category}</h4>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-[12px] font-medium text-slate-400">Plan Price</span>
                                            <span className="text-sm font-extrabold text-slate-900 tracking-tight">₹{plan.price.toLocaleString()}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[12px] font-medium text-slate-400">Total Credits</span>
                                                <div className="group/tip relative flex items-center">
                                                    <Info className="w-3 h-3 text-slate-300" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-10">
                                                        Total units added to wallet (deducts {plan.deduction_value} cr/msg)
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{plan.credits_offered.toLocaleString()} cr</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                            <span className="text-[12px] font-medium text-slate-400">Validity</span>
                                            <span className="text-sm font-bold text-slate-900">{plan.validity_days} Days</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 mt-2 bg-amber-50/50 px-2 -mx-2 rounded-lg border border-amber-100/50">
                                            <span className="text-[12px] font-bold text-amber-700">Effective Rate</span>
                                            <span className="text-sm font-black text-amber-800">₹{plan.effective_price}/msg</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => !isCurrent && handlePurchaseInitiate(plan)}
                                        disabled={isCurrent}
                                        className={cn(
                                            "mt-auto w-full py-3.5 rounded-2xl text-[13px] font-black transition-all flex items-center justify-center gap-2",
                                            isCurrent 
                                                ? "bg-slate-50 text-slate-400 cursor-default" 
                                                : "bg-[#128C7E] text-white hover:bg-[#0e7468] shadow-sm hover:scale-[1.02]"
                                        )}
                                    >
                                        {isCurrent ? "Active Plan" : "Buy Plan"}
                                        {!isCurrent && <ArrowRight className="w-4 h-4" />}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Checkout Modal Overlay - Portal to body to avoid layout transform issues */}
            {isMounted && showCheckoutModal && selectedPlan && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 md:px-0">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => checkoutStatus !== 'initiating' && checkoutStatus !== 'paying' && checkoutStatus !== 'verifying' && setShowCheckoutModal(false)} />
                    
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-teal-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Checkout</h2>
                                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Plan: {selectedPlan.name}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowCheckoutModal(false)}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 pt-4 space-y-6">
                            {checkoutStatus === 'success' ? (
                                <div className="py-12 flex flex-col items-center text-center space-y-4">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
                                        <Check className="w-10 h-10 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Purchase Successful!</h3>
                                    <p className="text-slate-500 font-medium">Your plan has been upgraded and credits added.</p>
                                </div>
                            ) : checkoutStatus === 'error' ? (
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-red-900">Purchase Failed</p>
                                        <p className="text-xs text-red-800/70 leading-relaxed font-medium">{checkoutMessage}</p>
                                        <button onClick={() => setCheckoutStatus('idle')} className="text-[10px] font-black uppercase text-red-600 hover:underline pt-2 inline-block">Try Again</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Order Summary Summary */}
                                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="text-slate-500">Plan Price</span>
                                            <span className="font-black text-slate-900">₹{selectedPlan.price.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="text-slate-500">GST (18%)</span>
                                            <span className="font-black text-slate-900">₹{(selectedPlan.price * 0.18).toLocaleString()}</span>
                                        </div>
                                        <div className="h-px bg-slate-200" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-black text-slate-900 uppercase">Total Amount</span>
                                            <span className="text-2xl font-black text-teal-600 tracking-tighter">₹{(selectedPlan.price * 1.18).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Information</p>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="relative group">
                                                <UserCheck className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-teal-600" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Full Name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-teal-500 transition-all text-sm font-bold placeholder:text-slate-400"
                                                />
                                            </div>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-teal-600" />
                                                <input 
                                                    type="email" 
                                                    placeholder="Email Address"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-teal-500 transition-all text-sm font-bold placeholder:text-slate-400"
                                                />
                                            </div>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-teal-600" />
                                                <input 
                                                    type="tel" 
                                                    placeholder="Mobile Number"
                                                    value={formData.mobile}
                                                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-teal-500 transition-all text-sm font-bold placeholder:text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                            {checkoutStatus === 'success' ? (
                                <Button 
                                    className="w-full h-14 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
                                    onClick={() => setShowCheckoutModal(false)}
                                >
                                    Close
                                </Button>
                            ) : (
                                <>
                                    <button 
                                        className="text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest px-2 transition-colors disabled:opacity-50"
                                        onClick={() => setShowCheckoutModal(false)}
                                        disabled={checkoutStatus !== 'idle'}
                                    >
                                        Cancel
                                    </button>
                                    <Button 
                                        className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                        onClick={handlePayment}
                                        disabled={checkoutStatus !== 'idle' && checkoutStatus !== 'error'}
                                    >
                                        {checkoutStatus === 'idle' || checkoutStatus === 'error' ? (
                                            <>Proceed to Pay <CreditCard className="w-4 h-4 ml-2" /></>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> {checkoutMessage}
                                            </span>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Footer Help */}
            <div className="bg-teal-900/5 rounded-3xl p-6 border border-teal-900/5 flex items-start gap-4">
                <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-teal-900">Can't find a suitable plan?</p>
                    <p className="text-xs text-teal-800/70 leading-relaxed max-w-2xl">
                        If none of the available plans fit your business needs, please reach out to your {data?.assigned_by_role === 'reseller' ? 'reseller' : 'system administrator'} for a custom enterprise plan or dedicated volume pricing.
                    </p>
                </div>
            </div>

        </div>
    )
}
