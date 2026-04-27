"use client"
 
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlansOverview, PlanSection, Plan } from "@/components/plans/PlansComponents"
import { Crown, LayoutGrid, ShieldCheck, Users, CheckCircle2, ArrowRight, ShoppingCart, Mail, Phone, Building2, FileText, Wallet, ArrowLeft, Loader2, PlusCircle, ChevronRight } from "lucide-react"
import { getAdminProfile, getGlobalUsers, getPlans, deletePlan } from "@/config/api"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import Script from "next/script"
import creditService from "@/services/creditService"
import { AlertTriangle, Trash2, XCircle } from "lucide-react"
import { emitPlanUpdate } from "@/lib/planEvents"

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function AdminPlansPage() {
    const router = useRouter()
    const [currentView, setCurrentView] = useState<'all' | 'reseller' | 'user'>('all')
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
    const [purchasedPlan, setPurchasedPlan] = useState<Plan | null>(null)
    const [isCheckout, setIsCheckout] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [resellerPlans, setResellerPlans] = useState<Plan[]>([])
    const [userPlans, setUserPlans] = useState<Plan[]>([])

    // Delete Confirmation State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [planIdToDelete, setPlanIdToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [errorNotification, setErrorNotification] = useState<{show: boolean, message: string}>({show: false, message: ""})

    // Form State
    const [formData, setFormData] = useState({
        name: "", // Will be fetched
        email: "",
        mobile: "",
        company: "",
        gstin: "",
        allocate_to_user_id: ""
    })

    const [availableUsers, setAvailableUsers] = useState<any[]>([])

    const [billingData, setBillingData] = useState({
        grossAmount: 0,
        gstAmount: 0,
        totalAmount: 0,
        credits: 0
    })

    // Fetch Profile, Users and Plans
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch Admin Profile for form pre-fill
                const profile = await getAdminProfile()
                setFormData(prev => ({
                    ...prev,
                    name: profile.name || "",
                    email: profile.email || "",
                    mobile: profile.phone || "",
                    company: profile.business_name || "",
                    gstin: profile.gstin || "",
                }))

                // Fetch Users for allocation dropdown
                const users = await getGlobalUsers()
                setAvailableUsers(users || [])

                // Fetch Real Plans from Backend
                const allPlans = await getPlans()
                
                // Map backend plans to UI format with robust category check
                const mappedPlans: Plan[] = allPlans.map((p: any) => {
                    const category = (p.plan_category || "").trim().toUpperCase();
                    
                    const price = parseFloat(p.price) || 0;
                    const credits = parseInt(p.credits_offered) || 0;
                    const deductionRate = parseFloat(p.deduction_value) || 1.0;
                    const netMessages = Math.floor(credits / deductionRate);
                    const effectivePrice = netMessages > 0 ? (price / netMessages).toFixed(2) : "0.00";

                    return {
                        plan_id: p.plan_id,
                        name: p.name,
                        price: `₹${price.toLocaleString()}`,
                        credits: netMessages.toLocaleString(),
                        rate: `₹${effectivePrice} per message`,
                        validity: `${p.validity_days} days`,
                        colorTheme: category === 'RESELLER' ? 'purple' : 'green'
                    };
                })

                setResellerPlans(mappedPlans.filter((p: Plan) => p.colorTheme === 'purple'))
                setUserPlans(mappedPlans.filter((p: Plan) => p.colorTheme === 'green'))

            } catch (error) {
                console.error("Failed to fetch page data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const confirmDeletePlan = (id: string) => {
        setPlanIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeletePlan = async () => {
        if (!planIdToDelete) return;
        
        setIsDeleting(true);
        try {
            await deletePlan(planIdToDelete);
            // Refresh
            const allPlans = await getPlans();
            const mappedRepo: Plan[] = allPlans.map((p: any) => {
                const category = (p.plan_category || "").trim().toUpperCase();
                
                const price = parseFloat(p.price) || 0;
                const credits = parseInt(p.credits_offered) || 0;
                const deductionRate = parseFloat(p.deduction_value) || 1.0;
                const netMessages = Math.floor(credits / deductionRate);
                const effectivePrice = netMessages > 0 ? (price / netMessages).toFixed(2) : "0.00";

                return {
                    plan_id: p.plan_id,
                    name: p.name,
                    price: `₹${price.toLocaleString()}`,
                    credits: netMessages.toLocaleString(),
                    rate: `₹${effectivePrice} per message`,
                    validity: `${p.validity_days} days`,
                    colorTheme: category === 'RESELLER' ? 'purple' : 'green'
                };
            });
            setResellerPlans(mappedRepo.filter((p: Plan) => p.colorTheme === 'purple'));
            setUserPlans(mappedRepo.filter((p: Plan) => p.colorTheme === 'green'));
            
            setIsDeleteDialogOpen(false);
            setPlanIdToDelete(null);
            setShowSuccess(true);
            
            // Broadcast update to other tabs/dashboards
            emitPlanUpdate();
            
            // Auto hide success after 5s
            setTimeout(() => setShowSuccess(false), 5000);
        } catch (err) {
            console.error("Failed to delete plan", err);
            setErrorNotification({ show: true, message: "Failed to delete plan. System was unable to process the request." });
            // Auto hide error after 5s
            setTimeout(() => setErrorNotification({ show: false, message: "" }), 5000);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditPlan = (plan: Plan) => {
        router.push(`/dashboard/admin/plans/create?edit=${plan.plan_id}`);
    };

    // Initialize billing data when plan is selected
    useEffect(() => {
        if (selectedPlan) {
            const price = parseInt(selectedPlan.price.replace(/[^0-9]/g, ''))
            const gst = Math.round(price * 0.18)
            setBillingData({
                grossAmount: price,
                gstAmount: gst,
                totalAmount: price + gst,
                credits: parseInt(selectedPlan.credits.replace(/,/g, ''))
            })
        }
    }, [selectedPlan])

    const handlePurchaseInitiate = (plan: Plan) => {
        setSelectedPlan(plan)
        setIsCheckout(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleFinalPurchase = async () => {
        if (!formData.allocate_to_user_id) {
            alert("Please select a user to allocate this plan to.");
            return;
        }
        setIsLoading(true)
        try {
            const token = localStorage.getItem('token') || "mock-admin-token-6631";
            
            if (!selectedPlan) return;
            
            // Initiate payment with real backend
            const payload = {
                plan_name: selectedPlan.name,
                credits: billingData.credits,
                price: billingData.grossAmount,
                allocated_to_user_id: formData.allocate_to_user_id
            };
            
            const response = await creditService.initiatePayment(payload, token);
            
            if (response.success && response.razorpay_order_id) {
                // Open Razorpay Checkout
                const options = {
                    key: response.key,
                    amount: response.amount,
                    currency: response.currency,
                    name: "WhatsApp Platform",
                    description: `${selectedPlan.name} Plan`,
                    order_id: response.razorpay_order_id,
                    handler: async function (paymentResponse: any) {
                        try {
                            setIsLoading(true);
                            await creditService.verifyPayment({
                                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                razorpay_order_id: paymentResponse.razorpay_order_id,
                                razorpay_signature: paymentResponse.razorpay_signature
                            }, token);
                            
                            setPurchasedPlan(selectedPlan);
                            setShowSuccess(true);
                            setIsCheckout(false);
                            setSelectedPlan(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        } catch (err) {
                            alert("Payment verification failed.");
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    prefill: {
                        name: formData.name,
                        email: formData.email,
                        contact: formData.mobile
                    },
                    theme: {
                        color: "#4f46e5"
                    }
                };
                
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                throw new Error("Failed to initialize Razorpay");
            }
        } catch (error: any) {
            console.error("Purchase failed:", error);
            alert(error.response?.data?.detail || error.message || "Payment process failed.");
        } finally {
            setIsLoading(false);
        }
    }

    if (isCheckout && selectedPlan) {
        return (
            <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                {/* Back Button */}
                <Button 
                    variant="ghost" 
                    className="group font-black text-slate-500 hover:text-indigo-600 -ml-4"
                    onClick={() => setIsCheckout(false)}
                >
                    <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
                    Back to Plans
                </Button>

                {/* Checkout Header */}
                <div className="flex items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-800">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                        <ShoppingCart className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Plan Purchase</h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Complete your secure checkout</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Personal Information */}
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    Personal & Business Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <Input 
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-indigo-500 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <Input 
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-indigo-500 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <Input 
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                            className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-indigo-500 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                                        <Input 
                                            value={formData.company}
                                            onChange={(e) => setFormData({...formData, company: e.target.value})}
                                            className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-indigo-500 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Allocate Plan To
                                        <Badge variant="outline" className="text-[9px] font-black uppercase text-indigo-600 border-indigo-200">
                                            {selectedPlan.colorTheme === 'purple' ? "Resellers Only" : "Business Users Only"}
                                        </Badge>
                                    </label>
                                    <Select 
                                        value={formData.allocate_to_user_id} 
                                        onValueChange={(value) => setFormData({...formData, allocate_to_user_id: value})}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold">
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">

                                            {availableUsers
                                                .filter(user => {
                                                    const isResellerPlan = selectedPlan.colorTheme === 'purple';
                                                    if (isResellerPlan) return user.role === "Reseller";
                                                    return user.role === "Direct Business";
                                                })
                                                .map((user) => {
                                                    const userId = user.id || user.busi_user_id;
                                                    const name = user.name || user.profile?.name || user.business?.business_name || 'Unnamed';
                                                    const email = user.email || user.profile?.email || 'No email';
                                                    return (
                                                        <SelectItem key={userId} value={userId} className="font-bold">
                                                            <div className="flex flex-col">
                                                                <span>{name}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">{email}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Plan Summary Card */}
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-indigo-600 text-white">
                            <CardContent className="p-8 flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Selected Plan</p>
                                    <h2 className="text-4xl font-black tracking-tighter uppercase">{selectedPlan.name}</h2>
                                    <div className="flex items-center gap-3 pt-2">
                                        <Badge className="bg-white/20 text-white border-none font-black px-4 py-1 rounded-full uppercase text-[10px]">
                                            {selectedPlan.credits} Credits
                                        </Badge>
                                        <Badge className="bg-white/20 text-white border-none font-black px-4 py-1 rounded-full uppercase text-[10px]">
                                            {selectedPlan.validity} Validity
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10">
                                    <Crown className="w-16 h-16 opacity-40 rotate-12" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* Billing Summary */}
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden sticky top-8">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                    <Wallet className="h-4 w-4 text-indigo-600" />
                                    Billing Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gross Amount</span>
                                        <span className="font-black text-slate-900">₹{billingData.grossAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">GST (18%)</span>
                                        <span className="font-black text-slate-900">₹{billingData.gstAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-2 border-dashed border-t"></div>
                                    <div className="flex justify-between items-end pb-4">
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Payable</span>
                                        <span className="text-4xl font-black text-indigo-600 tracking-tighter">₹{billingData.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <Button 
                                    className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 transition-all font-black uppercase tracking-widest text-xs"
                                    onClick={handleFinalPurchase}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>Proceed to Payment <ArrowRight className="ml-2 w-4 h-4" /></>
                                    )}
                                </Button>

                                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                    Secure 256-bit encrypted transaction • Handled by Razorpay
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading && !isCheckout) {
        return (
            <div className="flex h-[70vh] items-center justify-center flex-col space-y-6 animate-in fade-in duration-700">
                 <div className="relative">
                    <div className="w-20 h-20 rounded-3xl border-4 border-indigo-600/20 border-t-indigo-600 animate-spin transition-all"></div>
                    <ShieldCheck className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                 </div>
                 <div className="text-center space-y-2">
                    <p className="font-black text-slate-900 dark:text-white text-xl tracking-tighter uppercase">Synchronizing Tiers</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Infrastructure Management • Subscription Engine</p>
                 </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
            <Script 
                src="https://checkout.razorpay.com/v1/checkout.js" 
                strategy="afterInteractive" 
            />
            {/* Success Notification */}
            {showSuccess && purchasedPlan && (
                <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-full duration-500">
                    <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-400/30 backdrop-blur-md">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-tighter">Purchase Successful</p>
                            <p className="text-xs font-bold opacity-90">{purchasedPlan.name} Tier Activated</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white hover:bg-white/10 ml-4 font-black"
                            onClick={() => setShowSuccess(false)}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Error Notification */}
            {errorNotification.show && (
                <div className="fixed top-24 right-8 z-[60] animate-in slide-in-from-right-full duration-500">
                    <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-rose-400/30 backdrop-blur-md">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-tighter">Action Failed</p>
                            <p className="text-xs font-bold opacity-90">{errorNotification.message}</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white hover:bg-white/10 ml-4 font-black"
                            onClick={() => setErrorNotification({ show: false, message: "" })}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[440px] border-none shadow-[0_30px_60px_-15px_rgba(220,38,38,0.25)] rounded-[3rem] p-0 overflow-hidden bg-white dark:bg-slate-900 transition-all duration-500">
                    <div className="bg-red-50 dark:bg-red-950/20 p-10 flex flex-col items-center text-center border-b border-red-100 dark:border-red-900/30">
                        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/40 rounded-[2.5rem] flex items-center justify-center mb-8 relative shadow-inner">
                            <div className="absolute inset-0 bg-red-500/20 rounded-[2.5rem] animate-ping opacity-25"></div>
                            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-500 relative z-10" />
                        </div>
                        <DialogTitle className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3 leading-none">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 font-bold text-sm px-4 leading-relaxed">
                            Are you sure you want to delete this plan? This action is permanent and cannot be reversed.
                        </DialogDescription>
                    </div>
                    <DialogFooter className="p-8 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-2 border-slate-100 transition-all active:scale-95"
                        >
                            No, Keep it
                        </Button>
                        <Button 
                            onClick={handleDeletePlan}
                            disabled={isDeleting}
                            className="flex-1 h-16 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-200 dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-95 group"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    Yes, Delete Plan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                        Plan Management
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span>Infrastructure</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-indigo-600/80">Subscription Plans</span>
                    </div>
                </div>

                <Button 
                    onClick={() => router.push("/dashboard/admin/plans/create")}
                    className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group"
                >
                    <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    Create New Plan
                </Button>
            </div>

            <div className="space-y-10">
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight text-capitalize">
                            {currentView === 'all' ? 'System Overview' : `${currentView} Plans Overview`}
                        </h2>
                    </div>

                    {/* Premium Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {/* ALL PLANS CARD */}
                        <button 
                            onClick={() => setCurrentView('all')}
                            className={cn(
                                "p-8 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 group text-left border-2",
                                currentView === 'all' 
                                    ? "bg-white dark:bg-slate-900 border-indigo-600 shadow-[0_20px_50px_rgba(79,70,229,0.15)] ring-4 ring-indigo-50"
                                    : "bg-slate-50/50 border-transparent hover:border-slate-200"
                            )}
                        >
                            <div className="relative z-10 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.2em]",
                                        currentView === 'all' ? "text-indigo-600" : "text-slate-400"
                                    )}>Global Portfolio</p>
                                    <p className={cn(
                                        "text-4xl font-black tracking-tighter",
                                        currentView === 'all' ? "text-slate-900 dark:text-white" : "text-slate-600"
                                    )}>{(resellerPlans.length + userPlans.length) || 0}</p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className={cn("w-2 h-2 rounded-full", currentView === 'all' ? "bg-indigo-500 animate-pulse" : "bg-slate-300")} />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tiers</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "p-5 rounded-[2rem] transition-transform duration-500 group-hover:scale-110",
                                    currentView === 'all' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "bg-white text-slate-400 shadow-sm"
                                )}>
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                            </div>
                        </button>

                        {/* RESELLER PLANS CARD */}
                        <button 
                            onClick={() => setCurrentView('reseller')}
                            className={cn(
                                "p-8 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 group text-left border-2",
                                currentView === 'reseller' 
                                    ? "bg-white dark:bg-slate-900 border-purple-600 shadow-[0_20px_50px_rgba(147,51,234,0.15)] ring-4 ring-purple-50"
                                    : "bg-slate-50/50 border-transparent hover:border-slate-200"
                            )}
                        >
                            <div className="relative z-10 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.2em]",
                                        currentView === 'reseller' ? "text-purple-600" : "text-slate-400"
                                    )}>Reseller Infrastructure</p>
                                    <p className={cn(
                                        "text-4xl font-black tracking-tighter",
                                        currentView === 'reseller' ? "text-slate-900 dark:text-white" : "text-slate-600"
                                    )}>{resellerPlans.length || 0}</p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className={cn("w-2 h-2 rounded-full", currentView === 'reseller' ? "bg-purple-500 animate-pulse" : "bg-slate-300")} />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner Plans</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "p-5 rounded-[2rem] transition-transform duration-500 group-hover:scale-110",
                                    currentView === 'reseller' ? "bg-purple-600 text-white shadow-xl shadow-purple-200" : "bg-white text-slate-400 shadow-sm"
                                )}>
                                    <Crown className="h-8 w-8" />
                                </div>
                            </div>
                        </button>

                        {/* USER PLANS CARD */}
                        <button 
                            onClick={() => setCurrentView('user')}
                            className={cn(
                                "p-8 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 group text-left border-2",
                                currentView === 'user' 
                                    ? "bg-white dark:bg-slate-900 border-emerald-600 shadow-[0_20px_50px_rgba(16,185,129,0.15)] ring-4 ring-emerald-50"
                                    : "bg-slate-50/50 border-transparent hover:border-slate-200"
                            )}
                        >
                            <div className="relative z-10 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.2em]",
                                        currentView === 'user' ? "text-emerald-600" : "text-slate-400"
                                    )}>Direct Business Users</p>
                                    <p className={cn(
                                        "text-4xl font-black tracking-tighter",
                                        currentView === 'user' ? "text-slate-900 dark:text-white" : "text-slate-600"
                                    )}>{userPlans.length || 0}</p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className={cn("w-2 h-2 rounded-full", currentView === 'user' ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Solutions</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "p-5 rounded-[2rem] transition-transform duration-500 group-hover:scale-110",
                                    currentView === 'user' ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200" : "bg-white text-slate-400 shadow-sm"
                                )}>
                                    <Users className="h-8 w-8" />
                                </div>
                            </div>
                        </button>
                    </div>
                </section>

                {(currentView === 'all' || currentView === 'reseller') && (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                <Crown className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Reseller Tiers</h2>
                        </div>
                        <PlanSection
                            title="Reseller Plans"
                            icon={<Crown className="h-5 w-5 text-purple-600" />}
                            plans={resellerPlans}
                            hideToggle
                            onPurchase={handlePurchaseInitiate}
                            onEdit={handleEditPlan}
                            onDelete={confirmDeletePlan}
                            hidePurchase={true}
                        />
                    </section>
                )}

                {(currentView === 'all' || currentView === 'user') && (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-xl text-green-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Active User Tiers</h2>
                        </div>
                        <PlanSection
                            title="User Plans"
                            icon={<Users className="h-5 w-5 text-green-600" />}
                            plans={userPlans}
                            hideToggle
                            onPurchase={handlePurchaseInitiate}
                            onEdit={handleEditPlan}
                            onDelete={confirmDeletePlan}
                            hidePurchase={true}
                        />
                    </section>
                )}
            </div>
        </div>
    )
}



