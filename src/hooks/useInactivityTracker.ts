"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"

/**
 * Hook to track user inactivity and handle session management.
 * @param thresholdInMinutes - Time in minutes before auto-logout (default: 15)
 */
export const useInactivityTracker = (thresholdInMinutes: number = 15) => {
    const { logout } = useAuth()
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const thresholdMs = thresholdInMinutes * 60 * 1000

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }
        
        timerRef.current = setTimeout(() => {
            const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0")
            const now = Date.now()
            
            // Re-verify if we were actually inactive (cross-tab check)
            if (now - lastActivity >= thresholdMs) {
                console.log("Inactivity threshold reached. Logging out.")
                logout()
            } else {
                // Another tab was active, reset timer for this tab too
                resetTimer()
            }
        }, thresholdMs)
        
        localStorage.setItem("lastActivity", Date.now().toString())
    }, [logout, thresholdMs])

    useEffect(() => {
        const events = ["mousedown", "keydown", "scroll", "click", "mousemove"]
        
        const handleActivity = () => {
            resetTimer()
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0")
                const now = Date.now()
                
                if (now - lastActivity >= thresholdMs) {
                    console.log("Session expired during background inactivity.")
                    logout()
                } else {
                    resetTimer()
                }
            }
        }

        const handleStorageChange = (e: StorageEvent) => {
            // If another tab logged out, sync here
            if (e.key === "token" && e.newValue === null) {
                logout()
            }
        }

        // Initialize
        resetTimer()

        // Add listeners
        events.forEach(event => window.addEventListener(event, handleActivity))
        document.addEventListener("visibilitychange", handleVisibilityChange)
        window.addEventListener("storage", handleStorageChange)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            events.forEach(event => window.removeEventListener(event, handleActivity))
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [resetTimer, logout, thresholdMs])

    return null
}
