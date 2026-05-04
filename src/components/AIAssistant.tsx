"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2 } from "lucide-react"
import axios from "@/config/axios"
import { API_BASE_URL } from "@/config/constants"

export default function AIAssistant() {
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
        {role: 'ai', content: 'Hello! I am your AI assistant. I can help you analyze your reseller dashboard, manage your users, and even perform actions like cancelling orders. How can I help you today?'}
    ])
    const [chatInput, setChatInput] = useState("")
    const [isAiTyping, setIsAiTyping] = useState(false)
    const [resellerId, setResellerId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        console.log("AI Assistant Loaded")
        // Get reseller ID from localStorage (check both keys for compatibility)
        const storedResellerId = localStorage.getItem("reseller_id")
        const storedUserId = localStorage.getItem("user_id")
        const id = storedResellerId || storedUserId
        
        console.log("AI Assistant Reseller ID:", id)
        if (id) {
            setResellerId(id)
        }
    }, [])

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [chatMessages, isAiTyping])

    const handleSendChatMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim() || isAiTyping || !resellerId) return

        const userMsg = chatInput.trim()
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setChatInput("")
        console.log("AI Assistant sending message:", userMsg)
        setIsAiTyping(true)

        try {
            // Using correct endpoint path based on main.py router prefix
            const response = await axios.post(`${API_BASE_URL}/reseller-analytics/ai-support`, {
                message: userMsg,
                reseller_id: resellerId
            })

            console.log("AI Assistant received response:", response.data)
            setChatMessages(prev => [...prev, { role: 'ai', content: response.data.reply }])
        } catch (err) {
            console.error("AI Error:", err)
            setChatMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting to my local engine. Please make sure the backend is running!" }])
        } finally {
            setIsAiTyping(false)
        }
    }

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
            {isChatOpen && (
                <div className="w-[380px] h-[500px] bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                    {/* Header */}
                    <div className="bg-linear-to-r from-blue-600 to-blue-700 p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">AI Copilot</h3>
                                <p className="text-blue-100 text-xs font-medium">Online & Powered by Llama3</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsChatOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/50 scroll-smooth">
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm border border-gray-100 dark:border-gray-700'
                                    }`}>
                                        {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isAiTyping && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700 flex gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendChatMessage} className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask anything about your dashboard..."
                                className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                            />
                            <button 
                                type="submit"
                                disabled={!chatInput.trim() || isAiTyping}
                                className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="w-16 h-16 bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 relative group"
            >
                {isChatOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
                <span className="absolute right-full mr-4 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    AI Assistant
                </span>
                {!isChatOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
                )}
            </button>
        </div>
    )
}
