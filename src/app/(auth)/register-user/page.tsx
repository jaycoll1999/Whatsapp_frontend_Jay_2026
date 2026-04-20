"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { UserPlus, User, Mail, Phone, Lock, Building2, FileText, CreditCard, MapPin, Hash, Eye, EyeOff, Loader2, AlertCircle, Coins, MessageSquare, Users } from "lucide-react"
import userService from "@/services/userService"

function UserRegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const resellerIdFromUrl = searchParams.get("reseller_id")
    
    const [resellerName, setResellerName] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (resellerIdFromUrl) {
            import("@/config/api").then(({ API_BASE_URL }) => {
                fetch(`${API_BASE_URL}/public/reseller/${resellerIdFromUrl}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.business_name || data.name) {
                            setResellerName(data.business_name || data.name)
                        }
                    })
                    .catch(e => console.error("Error fetching reseller info:", e))
            })
        }
    }, [resellerIdFromUrl])

    // Form State
    const [formData, setFormData] = useState({
        profile: {
            name: "",
            username: "",
            email: "",
            phone: "",
            password: "",
        },
        business: {
            business_name: "",
            business_description: "",
            erp_system: "",
            gstin: "",
        },
        address: {
            full_address: "",
            pincode: "",
            country: "",
        },
        settings: {
            credits_allocated: 0,
            whatsapp_mode: "unofficial",
        }
    })

    const [confirmPassword, setConfirmPassword] = useState("")

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            profile: { ...formData.profile, [e.target.name]: e.target.value }
        })
    }

    const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            business: { ...formData.business, [e.target.name]: e.target.value }
        })
    }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            address: { ...formData.address, [e.target.name]: e.target.value }
        })
    }

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            settings: { 
                ...formData.settings, 
                [name]: name === "credits_allocated" ? parseInt(value) || 0 : value 
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        if (formData.profile.password !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            // Reconstruct data with parent context
            const registrationData = {
                ...formData,
                parent_reseller_id: resellerIdFromUrl || null,
                parent_role: resellerIdFromUrl ? "reseller" : "admin"
            }

            console.log("Submitting Registration:", registrationData)
            
            await userService.registerUser(registrationData)
            
            router.push("/login?registered=true")
        } catch (err: any) {
            console.error("Registration error:", err)
            setError(err.response?.data?.detail || "Registration failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[1200px] my-4 relative z-10 px-4">
            {/* Main Card */}
            <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* Header Section */}
                <div className="text-center mb-6">
                    <div className="flex justify-start mb-2">
                        <Link href="/register" className="text-xs bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-1.5 group border border-blue-500/20">
                            <Building2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Register as Reseller
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Create User Account</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Register a new user to start managing WhatsApp campaigns
                    </p>
                </div>

                {/* Registration Type Badge */}
                <div className="flex justify-center mb-6">
                    {resellerName ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
                            <Users className="w-3.5 h-3.5" />
                            Registered under Reseller: <span className="underline decoration-amber-300">{resellerName}</span>
                        </div>
                    ) : (
                        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
                            <UserPlus className="w-3.5 h-3.5" />
                            Direct Administrative Registration
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Left Side: Personal & Business */}
                        <div className="space-y-8">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-widest border-b border-border pb-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground ml-1">Full Name *</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Full Name"
                                                className="input-field-compact"
                                                required
                                                value={formData.profile.name}
                                                onChange={handleProfileChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Username *</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="text"
                                                name="username"
                                                placeholder="Username"
                                                className="input-field-compact"
                                                required
                                                value={formData.profile.username}
                                                onChange={handleProfileChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Email *</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Email Address"
                                                className="input-field-compact"
                                                required
                                                value={formData.profile.email}
                                                onChange={handleProfileChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Phone *</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="Mobile Number"
                                                className="input-field-compact"
                                                required
                                                value={formData.profile.phone}
                                                onChange={handleProfileChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Details */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    Business Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Business Name *</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="text"
                                                name="business_name"
                                                placeholder="Business Name"
                                                className="input-field-compact"
                                                required
                                                value={formData.business.business_name}
                                                onChange={handleBusinessChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">GSTIN</label>
                                        <div className="relative group">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="text"
                                                name="gstin"
                                                placeholder="GSTIN (Optional)"
                                                className="input-field-compact"
                                                value={formData.business.gstin}
                                                onChange={handleBusinessChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Description</label>
                                        <div className="relative group">
                                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="text"
                                                name="business_description"
                                                placeholder="Short Description"
                                                className="input-field-compact"
                                                value={formData.business.business_description}
                                                onChange={handleBusinessChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">ERP System</label>
                                        <div className="relative group">
                                            <select
                                                name="erp_system"
                                                className="input-field-compact appearance-none bg-white pl-10"
                                                value={formData.business.erp_system}
                                                onChange={handleBusinessChange}
                                                style={{ paddingLeft: '0.75rem' }}
                                            >
                                                <option value="">Select ERP</option>
                                                <option value="SAP">SAP</option>
                                                <option value="Oracle">Oracle</option>
                                                <option value="Microsoft Dynamics">Microsoft Dynamics</option>
                                                <option value="Tally">Tally</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Address, Settings & Security */}
                        <div className="space-y-8">
                            {/* Address */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    Address
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Full Address</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="text"
                                                name="full_address"
                                                placeholder="Complete Address"
                                                className="input-field-compact"
                                                value={formData.address.full_address}
                                                onChange={handleAddressChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-700 ml-1">Country</label>
                                            <input
                                                type="text"
                                                name="country"
                                                placeholder="Country"
                                                className="input-field-compact pl-4!"
                                                value={formData.address.country}
                                                onChange={handleAddressChange}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-700 ml-1">Pincode</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                placeholder="Pincode"
                                                className="input-field-compact pl-4!"
                                                value={formData.address.pincode}
                                                onChange={handleAddressChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Settings */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                    <Coins className="w-4 h-4 text-blue-600" />
                                    Account Settings
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Credits Allocated</label>
                                        <div className="relative group">
                                            <Coins className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="number"
                                                name="credits_allocated"
                                                placeholder="Initial Credits"
                                                className="input-field-compact"
                                                value={formData.settings.credits_allocated}
                                                onChange={handleSettingsChange}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 font-bold text-gray-800 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                                    <Lock className="w-4 h-4 text-blue-600" />
                                    Security
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Password *</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="Password"
                                                className="input-field-compact pr-10"
                                                required
                                                value={formData.profile.password}
                                                onChange={handleProfileChange}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 ml-1">Confirm *</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm Password"
                                                className="input-field-compact pr-10"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row items-center gap-4 justify-between border-t border-border pt-6">
                        <p className="text-sm text-muted-foreground font-medium">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-600 font-bold hover:text-blue-500 transition-colors">
                                Sign in
                            </Link>
                        </p>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create User"
                                )}
                            </button>
                        </div>
                    </div>

                </form>
            </div>

            <style jsx global>{`
                .input-field-compact {
                    width: 100%;
                    padding-left: 2.5rem; 
                    padding-right: 0.75rem;
                    padding-top: 0.6rem;
                    padding-bottom: 0.6rem;
                    background-color: hsl(var(--background));
                    border-width: 1px;
                    border-color: hsl(var(--border));
                    border-radius: 0.5rem; /* rounded-lg */
                    color: hsl(var(--foreground));
                    font-size: 0.875rem; /* text-sm */
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .input-field-compact::placeholder {
                    opacity: 0.4;
                    font-size: 0.8rem;
                }
                .input-field-compact:focus {
                    outline: none;
                    background-color: hsl(var(--card));
                    border-color: rgb(37, 99, 235); /* blue-600 */
                    box-shadow: 0 0 0 1px rgb(37, 99, 235);
                }
                select.input-field-compact {
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 0.75rem center;
                    background-size: 1rem;
                }
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    )
}

export default function UserRegisterPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
            <UserRegisterForm />
        </Suspense>
    )
}
