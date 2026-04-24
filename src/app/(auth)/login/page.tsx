"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Briefcase, UserCheck } from "lucide-react"
import resellerService from "@/services/resellerService"
import businessService from "@/services/businessService"
import { useAuth } from "@/context/AuthContext"

function LoginPageContent() {
    const router = useRouter()
    const { login: authLogin } = useAuth()
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [loginType, setLoginType] = useState<"reseller" | "business">("reseller")

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setSuccessMessage("Registration successful! Please sign in.")
        }
        // Set login type based on URL parameter
        const type = searchParams.get("type")
        if (type === "reseller" || type === "business") {
            setLoginType(type)
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)
        setIsLoading(true)

        try {
            console.log("🚀 Starting login attempt:", { loginType, email: formData.email });
            let data;
            if (loginType === "reseller") {
                console.log("📡 Calling resellerService.login...");
                data = await resellerService.login(formData)
                console.log("✅ Reseller login success:", data);

                // Store token using AuthContext
                authLogin(data.access_token, data.reseller.role, data.refresh_token)

                // Redirect based on role
                console.log("🔀 Redirecting to analytics...");
                router.push("/dashboard/reseller/analytics")
            } else {
                console.log("📡 Calling businessService.login...");
                data = await businessService.login(formData)
                console.log("✅ Business login success:", data);

                // Store token using AuthContext
                authLogin(data.access_token, data.busi_user.role, data.refresh_token)

                // Redirect Business User
                console.log("🔀 Redirecting to dashboard...");
                router.push("/dashboard/user")
            }

        } catch (err: any) {
            console.error("❌ Login error:", err)
            setError(err.response?.data?.detail || "Invalid email or password.")
        } finally {
            console.log("🏁 Login attempt finished.");
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[440px] flex flex-col items-center">
            {/* Header Outside Card */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/register-user" className="text-blue-600 font-semibold hover:text-blue-500 transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>

            {/* Main Card */}
            <div className="w-full bg-card rounded-[2rem] shadow-2xl border border-border p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Login Type Toggle */}
                <div className="flex bg-secondary/50 p-1.5 rounded-2xl mb-8 relative border border-border">
                    <button
                        onClick={() => setLoginType("reseller")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${loginType === "reseller"
                            ? "bg-card text-blue-600 shadow-md ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                    >
                        <Briefcase className="w-4 h-4" /> Reseller
                    </button>
                    <button
                        onClick={() => setLoginType("business")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${loginType === "business"
                            ? "bg-card text-blue-600 shadow-md ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                    >
                        <UserCheck className="w-4 h-4" /> User
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="w-full pl-11 pr-12 py-3.5 bg-background border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="w-5 h-5 border-2 border-border rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
                        </label>
                        <Link href={`/forgot-password?email=${encodeURIComponent(formData.email)}`} className="text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}
