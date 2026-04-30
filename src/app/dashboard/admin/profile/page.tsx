"use client"

import { User, Mail, Shield, Calendar, MapPin, Phone, Edit2, Camera, Trash2, CheckCircle2, Lock, Bell, Globe } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import React, { useRef } from "react";
import { getAdminProfile, updateAdminProfile, uploadAdminProfileImage, removeAdminProfileImage } from "@/config/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/config/constants";

export default function AdminProfilePage() {
    const [adminData, setAdminData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    
    // Edit States
    const [isEditing, setIsEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = React.useState<any>({});
    const [editForm, setEditForm] = React.useState({
        name: "", email: "", phone: "", location: "", bio: "", business_name: "", gstin: ""
    });

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getAdminProfile();
                setAdminData(data);
                setEditForm({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone === "Not Provided" ? "" : (data.phone || ""),
                    location: data.location === "Global System Server" ? "" : (data.location || ""),
                    bio: data.bio || "",
                    business_name: data.business_name === "Not Provided" ? "" : (data.business_name || ""),
                    gstin: data.gstin === "Not Provided" ? "" : (data.gstin || "")
                });
            } catch (err) {
                console.error("Failed to load admin profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const validateForm = () => {
        const newErrors: any = {};
        
        // Email
        if (!editForm.email?.trim()) {
            newErrors.email = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
            newErrors.email = "Invalid email format";
        }

        // Phone
        if (!editForm.phone?.trim()) {
            newErrors.phone = "Phone number is required";
        } else {
            const phone = editForm.phone.trim();
            // Match exactly 10 digits OR +91 followed by 10 digits
            const phoneRegex = /^(\+91)?\d{10}$/;
            if (!phoneRegex.test(phone)) {
                newErrors.phone = "Enter a valid 10-digit phone number (optionally with +91)";
            }
        }

        // Company Name
        if (!editForm.business_name?.trim()) {
            newErrors.business_name = "Company name is required";
        } else if (editForm.business_name.trim().length < 2) {
            newErrors.business_name = "Minimum 2 characters required";
        } else if (/^\d+$/.test(editForm.business_name.trim())) {
            newErrors.business_name = "Company name cannot be only numeric";
        }

        // GSTIN (Optional)
        if (editForm.gstin?.trim()) {
            const gstin = editForm.gstin.trim();
            // Simplified check for GSTIN: 15 alphanumeric characters
            if (!/^[a-zA-Z0-9]{15}$/.test(gstin)) {
                newErrors.gstin = "Invalid GSTIN format (15-character alphanumeric required)";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            const res = await updateAdminProfile(editForm);
            if (res.status === false) {
                alert(res.message);
                return;
            }
            // Re-fetch to update state cleanly
            const data = await getAdminProfile();
            setAdminData(data);
            setIsEditing(false);
            setErrors({});
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadAdminProfileImage(file);
            // Update local state with new image URL
            setAdminData((prev: any) => ({
                ...prev,
                profile_image: result.profile_image_url
            }));
        } catch (error) {
            console.error("Failed to upload image", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };
    const handleRemoveImage = async () => {
        if (!confirm("Are you sure you want to remove your profile photo?")) return;

        setUploading(true);
        try {
            await removeAdminProfileImage();
            setAdminData((prev: any) => ({
                ...prev,
                profile_image: null
            }));
            alert("Profile photo removed successfully.");
        } catch (error) {
            console.error("Failed to remove image", error);
            alert("Failed to remove profile photo. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    // Construct full image URL
    const getImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        // Derive server root from API_BASE_URL (remove last /api)
        const serverRoot = API_BASE_URL.replace(/\/api$/, "");
        return `${serverRoot}${path}`;
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center space-x-2">
                 <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                 <p className="font-bold text-slate-500">Loading profile data...</p>
            </div>
        );
    }

    if (!adminData) {
        return (
             <div className="flex h-screen items-center justify-center">
                 <p className="font-bold text-slate-500">Could not retrieve profile information.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                    <div className="relative group">
                        <Avatar className="w-32 h-32 border-4 border-white shadow-2xl ring-2 ring-indigo-500/20 transition-transform group-hover:scale-105 duration-300 overflow-hidden">
                            <AvatarImage src={getImageUrl(adminData.profile_image)} className="object-cover" />
                            <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-600 text-white text-4xl font-bold">
                                {adminData.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'AD'}
                            </AvatarFallback>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
                                </div>
                            )}
                        </Avatar>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                        <button 
                            onClick={handleImageClick}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        {adminData.profile_image && (
                            <button 
                                onClick={handleRemoveImage}
                                disabled={uploading}
                                className="absolute bottom-4 -right-2 p-2 bg-rose-600 rounded-full text-white shadow-lg hover:bg-rose-700 transition-colors disabled:opacity-50 z-10"
                                title="Remove Photo"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                {isEditing ? (
                                    <Input 
                                        value={editForm.name} 
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        className="text-xl font-bold max-w-xs"
                                        placeholder="Your Full Name"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{adminData.name}</h1>
                                )}
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                            </div>
                            <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-xs">{adminData.role} • System Infrastructure</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 justify-center md:justify-start">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-indigo-500" /> 
                                {isEditing ? (
                                    <Input 
                                        value={editForm.location} 
                                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                                        className="h-8 w-40"
                                        placeholder="Location"
                                    />
                                ) : adminData.location}
                            </span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-500" /> Joined {adminData.joinedDate}</span>
                        </div>
                        <div className="max-w-md text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                            {isEditing ? (
                                <Textarea 
                                    value={editForm.bio} 
                                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                    className="w-full text-sm"
                                    placeholder="Add a bio..."
                                    rows={3}
                                />
                            ) : adminData.bio}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving} className="font-bold">Cancel</Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl">
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1 md:flex-none border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold px-6 rounded-xl">
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {adminData.stats.map((stat: any, idx: number) => {
                    // Map generic string icons to lucide if needed, or simply render fallback icons.
                    const IconComp = idx === 0 ? Globe : idx === 1 ? User : Shield;
                    return (
                        <Card key={idx} className="border-none bg-slate-50 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden group">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:bg-indigo-600 transition-colors duration-300">
                                    <IconComp className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="w-full">
                {/* Contact & Info */}
                <div className="w-full space-y-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="flex items-center gap-4 group">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                                        {isEditing ? (
                                            <Input 
                                                value={editForm.email} 
                                                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                                className={`h-8 mt-1 font-bold ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                placeholder="admin@example.com"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-slate-900 truncate" title={adminData.email}>{adminData.email}</p>
                                        )}
                                        {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</p>
                                        {isEditing ? (
                                            <Input 
                                                value={editForm.phone} 
                                                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                                className={`h-8 mt-1 font-bold ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                placeholder="+91 9876543210"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-slate-900">{adminData.phone}</p>
                                        )}
                                        {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.phone}</p>}
                                    </div>
                                </div>

                                {/* Added Company & GSTIN */}
                                <div className="flex items-center gap-4 group">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company Name</p>
                                        {isEditing ? (
                                            <Input 
                                                value={editForm.business_name} 
                                                onChange={(e) => setEditForm({...editForm, business_name: e.target.value})}
                                                className={`h-8 mt-1 font-bold ${errors.business_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                placeholder="Your Company Name"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-slate-900 truncate">{adminData.business_name}</p>
                                        )}
                                        {errors.business_name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.business_name}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 group">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">GSTIN / Tax ID</p>
                                        {isEditing ? (
                                            <Input 
                                                value={editForm.gstin} 
                                                onChange={(e) => setEditForm({...editForm, gstin: e.target.value})}
                                                className={`h-8 mt-1 font-bold ${errors.gstin ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                placeholder="GSTIN"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-slate-900 truncate">{adminData.gstin}</p>
                                        )}
                                        {errors.gstin && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.gstin}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-slate-100 my-6"></div>
                            <p className="text-sm font-black uppercase tracking-widest text-slate-900 mt-6 mb-4">Security Snapshot</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-bold text-emerald-700">2FA Enabled</span>
                                    </div>
                                    <Badge className="bg-emerald-500 text-white">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Lock className="w-4 h-4 text-slate-600" />
                                        <span className="text-sm font-bold text-slate-700">Last Password Change</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">2 days ago</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Settings & Activity */}
                {/* 
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden h-full">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900">System Preferences</CardTitle>
                                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage your dashboard experience</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {[
                                    { title: "Notification Settings", desc: "Configure how you receive system alerts", icon: Bell },
                                    { title: "Privacy Control", desc: "Manage data visibility and sharing", icon: Shield },
                                    { title: "System Logs Access", desc: "Configure who can view administrative logs", icon: Globe },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{item.title}</p>
                                                <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:text-indigo-700">Manage</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                */}
            </div>
        </div>
    )
}
