"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    ShieldCheck, User, Building2, Layout, Lock,
    Save, X, Loader2, CreditCard, Wallet,
    TrendingUp, DollarSign, Calendar, Mail,
    Phone, MapPin, Briefcase, Globe, Camera, Trash2
} from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import resellerService from "@/services/resellerService"
import { cn } from "@/lib/utils"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

interface ProfileProps {
    data: any | null
    onUpdate?: (updatedData: any) => Promise<void>
    onRemoveImage?: () => Promise<void>
}

/* ── Profile Hero Banner ── */
export function ProfileHeader({ data, onUpdate, onRemoveImage }: ProfileProps) {
    if (!data) return null

    const name = data.profile?.name || data.profile?.username || "User"
    const businessName = data.business?.business_name || name
    // Simplified subtitle to match screenshot vibe
    const subtitle = `${data.profile?.name || ""} ${data.profile?.phone ? ' - ' + data.profile.phone : ''} ${data.profile?.email ? ' - ' + data.profile.email : ''}`
    
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    const [uploading, setUploading] = useState(false)

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !onUpdate) return

        setUploading(true)
        try {
            const reader = new FileReader()
            reader.onloadend = async () => {
                const base64String = reader.result as string
                await onUpdate({
                    profile: { 
                        image_url: base64String
                    }
                })
                setUploading(false)
            }
            reader.readAsDataURL(file)
        } catch (err) {
            console.error("Failed to upload image:", err)
            setUploading(false)
        }
    }

    return (
        <div 
            className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 shadow-2xl mb-10 group/banner"
            style={{
                background: "linear-gradient(135deg, #0e7468 0%, #128C7E 40%, #1aaa9a 70%, #25D366 100%)",
            }}
        >
            {/* Decorative modern elements inspired by screenshot */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl transition-transform duration-700 group-hover/banner:scale-110" />
            <div className="absolute top-1/2 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl transition-transform duration-700 group-hover/banner:-translate-y-4" />
            <div className="absolute top-10 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-xl" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8 flex-col sm:flex-row text-center sm:text-left">
                    {/* Round Avatar Section on Left */}
                    <div className="relative shrink-0 group/avatar">
                        <input
                            type="file"
                            id="profile-upload-header"
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleImageChange}
                            disabled={uploading}
                        />
                        <label 
                            htmlFor="profile-upload-header" 
                            className="cursor-pointer block relative"
                        >
                            <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-white/20 shadow-2xl transition-all duration-500 group-hover/avatar:scale-105 ring-8 ring-white/5">
                                <AvatarImage 
                                    src={data.profile?.image_url} 
                                    className="object-cover" 
                                />
                                <AvatarFallback className="text-4xl font-black bg-white/10 text-white backdrop-blur-md">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            
                            {/* Hover Overlay */}
                            <div className={cn(
                                "absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-[2px]",
                                uploading && "opacity-100"
                            )}>
                                {uploading ? (
                                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-10 w-10 text-white transform scale-90 group-hover/avatar:scale-100 transition-transform" />
                                )}
                            </div>
                        </label>

                        {/* Remove Action */}
                        {data.profile?.image_url && onRemoveImage && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (window.confirm("Remove profile photo?")) onRemoveImage();
                                }}
                                className="absolute -top-1 -right-1 bg-white text-red-500 p-2 rounded-full shadow-2xl border border-slate-100 hover:scale-110 active:scale-95 transition-all z-10"
                                title="Remove Photo"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Branding/Info Text */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1.5 bg-black/20 text-white/90 rounded-lg backdrop-blur-md border border-white/10 shadow-sm">
                                {data.role === "business_owner" ? "BUSINESS USER" : (data.role === "reseller" ? "RESELLER" : "USER")}
                            </span>
                            {/* Subtle Pulse Indicator */}
                            <span className="flex h-2 w-2 relative">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", data.status === "active" ? "bg-green-400" : "bg-red-400")}></span>
                                <span className={cn("relative inline-flex rounded-full h-2 w-2", data.status === "active" ? "bg-green-400" : "bg-red-400")}></span>
                            </span>
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-md">
                            {businessName}
                        </h1>
                        
                        <p className="text-white/70 text-sm md:text-base font-medium tracking-wide max-w-2xl line-clamp-2">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Right Side Info (ERP System from screenshot) */}
                {data.business?.erp_system && (
                    <div className="md:text-right flex flex-col md:items-end gap-1.5 px-6 border-l md:border-l-0 md:border-r border-white/10 py-2">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">ERP SYSTEM</p>
                        <p className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase drop-shadow-sm">
                            {data.business.erp_system}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ── Profile Stats (soft pastel) ── */
export function ProfileStats({ data }: { data: any }) {
    if (!data) return null

    const stats = [
        {
            label: "Total Credits",
            value: (data.wallet?.credits_allocated || 0).toLocaleString(),
            icon: DollarSign,
            bg: "#EFF6FF", iconBg: "#DBEAFE", iconColor: "#2563EB", textColor: "#1D4ED8", borderColor: "#BFDBFE",
        },
        {
            label: "Used Credits",
            value: (data.wallet?.credits_used || 0).toLocaleString(),
            icon: TrendingUp,
            bg: "#F5F3FF", iconBg: "#EDE9FE", iconColor: "#7C3AED", textColor: "#6D28D9", borderColor: "#DDD6FE",
        },
        {
            label: "Remaining Credits",
            value: Math.round((data.wallet?.credits_allocated || 0) - (data.wallet?.credits_used || 0)).toLocaleString(),
            icon: CreditCard,
            bg: "#F0FDF4", iconBg: "#DCFCE7", iconColor: "#16A34A", textColor: "#15803D", borderColor: "#BBF7D0",
        },
        {
            label: "Available to Distribute",
            value: Math.round((data.wallet?.credits_allocated || 0) - (data.wallet?.credits_used || 0)).toLocaleString(),
            icon: Wallet,
            bg: "#FFFBEB", iconBg: "#FEF3C7", iconColor: "#D97706", textColor: "#B45309", borderColor: "#FDE68A",
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
            {stats.map((s, i) => {
                const Icon = s.icon
                return (
                    <div
                        key={i}
                        className="rounded-2xl p-4 border flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        style={{ background: s.bg, borderColor: s.borderColor }}
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg }}>
                            <Icon className="h-4 w-4" style={{ color: s.iconColor }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s.textColor, opacity: 0.65 }}>
                                {s.label}
                            </p>
                            <p className="text-lg font-bold tracking-tight mt-0.5" style={{ color: s.textColor }}>
                                {s.value}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ── Personal Info Section ── */
export function PersonalInfoSection({ data, onUpdate, onRemoveImage }: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: data?.profile?.name || "",
        email: data?.profile?.email || "",
        phone: data?.profile?.phone || "",
        country: data?.address?.country || "",
        full_address: data?.address?.full_address || "",
    })

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !onUpdate) return

        // 2MB check
        if (file.size > 2 * 1024 * 1024) {
            alert("File size must be less than 2MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64String = reader.result as string
            try {
                setLoading(true)
                await onUpdate({
                    profile: { 
                        image_url: base64String,
                        username: data?.profile?.username,
                        name: data?.profile?.name,
                        email: data?.profile?.email,
                        phone: data?.profile?.phone
                    }
                })
                alert("Profile photo updated successfully!")
            } catch (err) {
                console.error(err)
                alert("Failed to update profile photo")
            } finally {
                setLoading(false)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        if (!onUpdate) return
        setLoading(true)
        try {
            await onUpdate({
                profile: { name: formData.name, email: formData.email, phone: formData.phone, username: data?.profile?.username },
                address: { country: formData.country, full_address: formData.full_address },
            })
            setIsEditing(false)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <CardTitle className="text-[15px] font-semibold text-slate-800">Personal Information</CardTitle>
                    </div>
                    {isEditing ? (
                        <div className="flex gap-1.5">
                            <Button variant="ghost" size="sm"
                                className="text-green-600 h-8 px-3 text-xs font-semibold hover:bg-green-50 gap-1"
                                onClick={handleSave} disabled={loading}>
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                Save
                            </Button>
                            <Button variant="ghost" size="sm"
                                className="text-red-500 h-8 px-3 text-xs font-semibold hover:bg-red-50 gap-1"
                                onClick={() => setIsEditing(false)} disabled={loading}>
                                <X className="h-3 w-3" /> Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm"
                            className="text-[#128C7E] h-8 px-3 text-xs font-semibold hover:bg-teal-50"
                            onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                {/* Profile Photo Upload Area */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-6 border-b border-slate-50">
                    <div className="relative group">
                        <Avatar className="h-20 w-20 border-2 border-slate-100 shadow-sm">
                            <AvatarImage src={data?.profile?.image_url} className="object-cover" />
                            <AvatarFallback className="bg-blue-50 text-blue-600 text-2xl font-bold">
                                {data?.profile?.name?.charAt(0) || data?.profile?.username?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <h4 className="text-sm font-semibold text-slate-800">Profile Photo</h4>
                        <p className="text-xs text-slate-500">Update your photo. Max size 2MB (JPG, PNG, WEBP).</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                            <input
                                type="file"
                                id="personal-info-upload"
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange}
                            />
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs gap-1.5 border-slate-200 hover:border-blue-200 hover:bg-blue-50/50"
                                onClick={() => document.getElementById('personal-info-upload')?.click()}
                                disabled={loading}
                            >
                                <Camera className="h-3.5 w-3.5 text-slate-500" />
                                {loading ? "Uploading..." : "Upload Photo"}
                            </Button>
                            {data?.profile?.image_url && onRemoveImage && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-xs gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to remove your profile photo?")) {
                                            onRemoveImage();
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove Photo
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Full Name", key: "name", icon: User },
                            { label: "Email Address", key: "email", icon: Mail },
                            { label: "Mobile Number", key: "phone", icon: Phone },
                            { label: "Country", key: "country", icon: Globe },
                            { label: "Address", key: "full_address", icon: MapPin },
                        ].map(({ label, key, icon: Icon }) => (
                            <div key={key} className={cn("space-y-1.5", key === "full_address" ? "col-span-2" : "")}>
                                <label className="section-label flex items-center gap-1">
                                    <Icon className="h-3 w-3" />{label}
                                </label>
                                <Input
                                    value={formData[key as keyof typeof formData]}
                                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    className="h-10 rounded-xl border-slate-200 focus:border-[#128C7E] focus:ring-[#128C7E]/20"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        <InfoItem icon={User}   label="Full Name"     value={data?.profile?.name || "Not provided"} />
                        <InfoItem icon={Mail}   label="Email Address" value={data?.profile?.email || "Not provided"} />
                        <InfoItem icon={Phone}  label="Mobile Number" value={data?.profile?.phone || "Not provided"} />
                        <InfoItem icon={Globe}  label="Country"       value={data?.address?.country || "Not specified"} />
                        <InfoItem icon={MapPin} label="Address"       value={data?.address?.full_address || "Not specified"} fullWidth />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

/* ── Business Info Section ── */
export function BusinessInfoSection({ data, onUpdate }: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        business_name: data?.business?.business_name || data?.business?.company_name || "",
        organization_type: data?.business?.organization_type || "",
        erp_system: data?.business?.erp_system || data?.business?.erp_type || "",
        bank_name: data?.business?.bank_name || data?.bank?.bank_name || "",
    })

    const handleSave = async () => {
        if (!onUpdate) return
        setLoading(true)
        try {
            const isReseller = data?.role === "reseller" || data?.role === "business_owner" && !data?.parent_reseller_id
            
            const businessData: any = {
                business_name: formData.business_name,
                organization_type: formData.organization_type,
                erp_system: formData.erp_system,
            }

            // For Business Users, bank_name is inside business object
            // For Resellers, bank_name is in its own bank object
            const payload: any = { business: businessData }
            
            if (formData.bank_name) {
                if (isReseller) {
                    payload.bank = { bank_name: formData.bank_name }
                } else {
                    businessData.bank_name = formData.bank_name
                }
            }

            await onUpdate(payload)
            setIsEditing(false)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <CardTitle className="text-[15px] font-semibold text-slate-800">Business Information</CardTitle>
                    </div>
                    {isEditing ? (
                        <div className="flex gap-1.5">
                            <Button variant="ghost" size="sm"
                                className="text-green-600 h-8 px-3 text-xs font-semibold hover:bg-green-50 gap-1"
                                onClick={handleSave} disabled={loading}>
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                Save
                            </Button>
                            <Button variant="ghost" size="sm"
                                className="text-red-500 h-8 px-3 text-xs font-semibold hover:bg-red-50 gap-1"
                                onClick={() => setIsEditing(false)}>
                                <X className="h-3 w-3" /> Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm"
                            className="text-[#128C7E] h-8 px-3 text-xs font-semibold hover:bg-teal-50"
                            onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Company Name",      key: "business_name" },
                            { label: "Organization Type", key: "organization_type" },
                            { label: "ERP Type",          key: "erp_system" },
                            { label: "Bank Name",         key: "bank_name" },
                        ].map(({ label, key }) => (
                            <div key={key} className="space-y-1.5">
                                <label className="section-label">{label}</label>
                                <Input
                                    value={formData[key as keyof typeof formData]}
                                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    className="h-10 rounded-xl border-slate-200 focus:border-[#128C7E] focus:ring-[#128C7E]/20"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        <InfoItem icon={Briefcase} label="Company Name"      value={data?.business?.business_name      || data?.business?.company_name || "Not provided"} />
                        <InfoItem icon={Building2} label="Organization Type" value={data?.business?.organization_type || "Not provided"} />
                        <InfoItem icon={Layout}    label="ERP Type"          value={data?.business?.erp_system         || data?.business?.erp_type      || "Not provided"} />
                        <InfoItem icon={Building2} label="Bank Name"         value={data?.business?.bank_name         || data?.bank?.bank_name         || "Not provided"} />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

/* ── Account Details ── */
export function AccountDetailsSection({ data }: { data: any }) {
    if (!data) return null
    return (
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <Layout className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-[15px] font-semibold text-slate-800">Account Details</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <InfoItem icon={CreditCard} label="Plan Type"  value={data?.plan_name || data?.plan?.plan_name || "N/A"} />
                    <InfoItem icon={User}       label="User Type"  value={data?.role === "business_owner" ? "Business User" : (data?.role === "reseller" ? "Reseller" : data?.role || "N/A")} />
                    <InfoItem icon={Calendar}   label="Expiry Date" value={data?.plan_expiry ? new Date(data.plan_expiry).toLocaleDateString() : "UNLIMITED"} isDynamic />
                    <InfoItem icon={User}       label="Username"   value={data?.profile?.username || "N/A"} />
                </div>
            </CardContent>
        </Card>
    )
}

/* ── Security Settings ── */
export function SecuritySettingsSection() {
    const [open, setOpen] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null); setSuccess(false)
        if (newPassword !== confirmPassword) { setError("Passwords do not match."); return }
        if (newPassword.length < 6) { setError("New password must be at least 6 characters."); return }
        setLoading(true)
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
            if (!token) throw new Error("No authentication token found")
            await resellerService.changePassword(token, { current_password: currentPassword, new_password: newPassword })
            setSuccess(true)
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
            setTimeout(() => { setOpen(false); setSuccess(false) }, 2000)
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update password. Please check your current password.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-amber-600" />
                    </div>
                    <CardTitle className="text-[15px] font-semibold text-slate-800">Security Settings</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center float">
                    <ShieldCheck className="h-7 w-7 text-slate-300" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-600">Password Protection</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[180px]">Keep your account secure by updating your password regularly.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#128C7E] hover:bg-[#0e7468] text-white font-semibold px-6 rounded-xl shadow-sm shadow-teal-200 btn-press">
                            Change Password
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[420px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">Change Password</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">Update your password to keep your account secure.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordChange} className="space-y-4 py-2">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium flex items-center gap-2">
                                    <X className="h-3.5 w-3.5 shrink-0" />{error}
                                </div>
                            )}
                            {success && (
                                <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                                    ✓ Password updated successfully!
                                </div>
                            )}
                            {[
                                { label: "Current Password", key: "current", value: currentPassword, set: setCurrentPassword },
                                { label: "New Password",     key: "new",     value: newPassword,     set: setNewPassword },
                                { label: "Confirm Password", key: "confirm", value: confirmPassword, set: setConfirmPassword },
                            ].map(({ label, key, value, set }) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="section-label">{label}</label>
                                    <Input type="password" required value={value}
                                        onChange={(e) => set(e.target.value)}
                                        className="h-10 rounded-xl border-slate-200 focus:border-[#128C7E]"
                                        placeholder={`Enter ${label.toLowerCase()}`} />
                                </div>
                            ))}
                            <DialogFooter className="pt-2">
                                <Button type="submit" disabled={loading}
                                    className="w-full bg-[#128C7E] hover:bg-[#0e7468] text-white font-semibold h-11 rounded-xl btn-press">
                                    {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating…</> : "Update Password"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

/* ── Shared info item ── */
function InfoItem({ label, value, fullWidth = false, isDynamic = false, icon: Icon }: {
    label: string; value: string; fullWidth?: boolean; isDynamic?: boolean; icon?: any
}) {
    return (
        <div className={cn("flex flex-col gap-1", fullWidth ? "col-span-2" : "")}>
            <span className="section-label flex items-center gap-1">
                {Icon && <Icon className="h-2.5 w-2.5" />}{label}
            </span>
            <span className={cn(
                "text-sm font-semibold text-slate-800",
                isDynamic && "text-[#128C7E]"
            )}>
                {value}
            </span>
        </div>
    )
}
