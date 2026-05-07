import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={["reseller"]}>
            <div className="relative min-h-screen">
                {children}
            </div>
        </ProtectedRoute>
    )
}
