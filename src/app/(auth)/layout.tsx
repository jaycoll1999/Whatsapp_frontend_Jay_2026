export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden animated-bg">

            {/* Floating decorative blobs */}
            <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #25D366 0%, transparent 70%)" }} />
            <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full opacity-15"
                style={{ background: "radial-gradient(circle, #128C7E 0%, transparent 70%)" }} />
            <div className="absolute top-[40%] right-[10%] w-[180px] h-[180px] rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }} />

            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                    backgroundSize: "48px 48px"
                }}
            />

            {/* WhatsApp-style floating chat bubbles */}
            <div className="absolute top-[15%] left-[8%] opacity-10 float" style={{ animationDelay: "0s" }}>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-lg">
                    <div className="w-24 h-2 bg-white/60 rounded" />
                    <div className="w-16 h-2 bg-white/40 rounded mt-1.5" />
                </div>
            </div>
            <div className="absolute top-[25%] right-[8%] opacity-10 float" style={{ animationDelay: "1.5s" }}>
                <div className="bg-white/80 rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg">
                    <div className="w-20 h-2 bg-white/60 rounded" />
                    <div className="w-28 h-2 bg-white/40 rounded mt-1.5" />
                </div>
            </div>
            <div className="absolute bottom-[22%] left-[12%] opacity-10 float" style={{ animationDelay: "0.8s" }}>
                <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-lg">
                    <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full flex flex-col items-center">
                {children}
            </div>
        </div>
    )
}
