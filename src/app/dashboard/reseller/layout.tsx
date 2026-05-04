import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AIAssistant from "@/components/AIAssistant"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={["reseller"]}>
            <div className="relative min-h-screen">
                {children}
                <AIAssistant />
            </div>
        </ProtectedRoute>
    )
}
