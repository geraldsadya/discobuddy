"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, User, ArrowLeft, Mic, Paperclip, Moon } from "lucide-react"
import MarkdownMessage from "@/components/MarkdownMessage"
interface Message {
  id: number
  type: "user" | "ai"
  content: string
  timestamp: Date
}

interface ChatHistoryItem {
  id: number
  title: string
  time: string
}

const COLORS = [
  { glow: "rgba(139, 92, 246, 0.6)", text: "rgb(139, 92, 246)" },
  { glow: "rgba(59, 130, 246, 0.6)", text: "rgb(59, 130, 246)" },
  { glow: "rgba(16, 185, 129, 0.6)", text: "rgb(16, 185, 129)" },
  { glow: "rgba(245, 158, 11, 0.6)", text: "rgb(245, 158, 11)" },
  { glow: "rgba(236, 72, 153, 0.6)", text: "rgb(236, 72, 153)" },
  { glow: "rgba(99, 102, 241, 0.6)", text: "rgb(99, 102, 241)" },
]

const EXAMPLE_QUESTIONS = [
  "Tell me about Discovery's KeyCare plans",
  "How do I join Vitality?",
  "What banking products does Discovery offer?",
]

export default function DiscoBuddyLanding() {
  // State
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [colorIndex, setColorIndex] = useState(0)
  const [messageIdCounter, setMessageIdCounter] = useState(1)
  const [inputHeight, setInputHeight] = useState(0)
  const [isNewUser, setIsNewUser] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)

  // Color cycling effect
  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLORS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isDiscovering])

  // Focus textarea after AI response
  useEffect(() => {
    if (!isDiscovering && messages.length > 0) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isDiscovering, messages.length])

  // Update input height for dynamic padding
  useEffect(() => {
    if (inputRef.current) {
      setInputHeight(inputRef.current.offsetHeight)
    }
  }, [prompt, isDiscovering])

  const askQuestion = async (question: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: question }]
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')
      const data = await response.json()
      return data.response || "I'm sorry, I couldn't process that request."
    } catch (error) {
      console.error('Error asking question:', error)
      return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
    }
  }

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    const userMessage: Message = {
      id: messageIdCounter,
      type: "user",
      content: prompt,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessageId = messageIdCounter
    setMessageIdCounter(prev => prev + 1)
    setIsDiscovering(true)

    const currentPrompt = prompt
    setPrompt("")

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const response = await askQuestion(currentPrompt)
      setIsDiscovering(false)

      const aiMessage: Message = {
        id: currentMessageId + 1,
        type: "ai",
        content: response,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
      setMessageIdCounter(prev => prev + 1)
    } catch (error) {
      setIsDiscovering(false)
      const errorMessage: Message = {
        id: currentMessageId + 1,
        type: "ai",
        content: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      setMessageIdCounter(prev => prev + 1)
    }
  }

  const resetChat = () => {
    setMessages([])
    setIsDiscovering(false)
    setMessageIdCounter(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isDiscovering) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const currentColor = COLORS[colorIndex]

  // Dark mode conditional classes
  const darkModeClasses = {
    bg: isDarkMode ? 'bg-black' : 'bg-background',
    text: isDarkMode ? 'text-white' : 'text-black',
    textSecondary: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    border: isDarkMode ? 'border-white/10' : 'border-black/5',
    headerBg: isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/5',
    sidebarBg: isDarkMode 
      ? "linear-gradient(to bottom, #1f2937, #111827)"
      : "linear-gradient(to bottom, #f9fafb, #e5e7eb)",
    inputBg: isDarkMode 
      ? 'bg-white/5 border-white/10 focus:border-white/20 placeholder:text-gray-500 text-white'
      : 'bg-white border-blue-100 focus:border-blue-200 placeholder:text-gray-500 text-black',
    buttonHover: isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black',
    sendButton: isDarkMode 
      ? 'bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-600 text-white'
      : 'bg-white hover:bg-gray-100 disabled:bg-white/10 disabled:text-gray-600 text-black',
    userBubble: isDarkMode 
      ? 'text-white bg-gray-400/30 border-gray-500/30'
      : 'text-black bg-blue-100 border-blue-200',
    gradientBg: isDarkMode 
      ? 'bg-gradient-to-t from-black via-black/90 to-transparent'
      : 'bg-gradient-to-t from-white via-white/90 to-transparent',
  }

  return (
    <div className={`min-h-screen relative overflow-y-auto ${darkModeClasses.bg}`}>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: darkModeClasses.sidebarBg }}
      >
        <div className="p-6 pt-16">
          <div className="flex items-center justify-end mb-4 h-8 pt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className={`p-1 flex items-center justify-center h-8 ${darkModeClasses.buttonHover}`}
            >
              <ArrowLeft
                className="w-5 h-5 transition-all duration-3000 ease-in-out"
                style={{
                  color: currentColor.text,
                  filter: `drop-shadow(0 0 8px ${currentColor.glow})`,
                }}
              />
            </Button>
          </div>

          <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto light-blue-scrollbar">
            <div className={`p-4 ${darkModeClasses.text}`}>
              Start a new conversation to see your chat history here.
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className={`fixed inset-0 z-30 ${isDarkMode ? 'bg-black/50' : 'bg-black/10'}`} 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 p-3 backdrop-blur-sm border-b ${darkModeClasses.headerBg}`}>
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 focus:outline-none"
              aria-label="Open sidebar"
            >
              <img 
                src={isDarkMode ? "/discovery-logo-white.svg" : "/discovery-logo-black.svg"} 
                alt="Discovery Logo" 
                className="w-10 h-10" 
              />
            </button>
            <div className="flex items-center gap-1 cursor-pointer" onClick={resetChat}>
              <div className="flex items-center text-lg font-light tracking-wider">
                <span className={darkModeClasses.text}>DISC</span>
                <span
                  className="transition-all duration-3000 ease-in-out"
                  style={{
                    color: currentColor.text,
                    textShadow: `0 0 20px ${currentColor.glow}, 0 0 40px ${currentColor.glow}`,
                  }}
                >
                  O
                </span>
                <span className={darkModeClasses.text}>BUDDY</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 transition-colors ${darkModeClasses.buttonHover}`}
            >
              <Moon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNewUser(!isNewUser)}
              className={`p-2 transition-colors ${darkModeClasses.buttonHover} flex items-center gap-2`}
            >
              <User className="w-4 h-4" />
              <span className={`text-sm font-light ${darkModeClasses.text}`}>
                {isNewUser ? "Join Discovery" : "Gerald"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen px-8">
        {messages.length === 0 && !isDiscovering ? (
          // Landing page
          <div className="flex items-center justify-center min-h-screen">
            <div className="max-w-3xl mx-auto text-center space-y-12">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-7xl font-light leading-tight">
                  <span className={darkModeClasses.text}>Hi, I'm</span>
                  <br />
                  <span className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                    DiscoBuddy.
                  </span>
                  <span className="inline-block animate-wave origin-bottom-left align-baseline ml-1">
                    👋
                  </span>
                </h1>
                <div className="w-12 h-px bg-white/30 mx-auto" />
                <p className={`text-xl font-light ${darkModeClasses.text}`}>
                  Your AI companion ready to help with any Discovery question.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Textarea
                    placeholder="What would you like to know?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={`w-full h-20 px-6 py-4 pr-16 text-sm border rounded-2xl resize-none focus:ring-0 focus:outline-none transition-all duration-3000 ease-in-out font-light backdrop-blur-sm ${darkModeClasses.inputBg}`}
                    style={{
                      boxShadow: `0 0 0 1px rgba(255,255,255,0.1), 0 0 20px ${currentColor.glow}`,
                      paddingTop: '1.5rem',
                      paddingBottom: '0.5rem',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLTextAreaElement).style.boxShadow = `0 0 0 1px rgba(255,255,255,0.2), 0 0 30px ${currentColor.glow}`
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLTextAreaElement).style.boxShadow = `0 0 0 1px rgba(255,255,255,0.1), 0 0 20px ${currentColor.glow}`
                    }}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`absolute right-16 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 transition-colors ${darkModeClasses.buttonHover}`}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  {prompt.trim() && (
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      className={`absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 p-0 rounded-xl transition-all duration-300 ${darkModeClasses.sendButton}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {EXAMPLE_QUESTIONS.map((example) => (
                    <Button
                      key={example}
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrompt(example)}
                      className={`rounded-full px-4 py-2 text-sm font-light transition-all duration-300 ${
                        isDarkMode 
                          ? 'text-gray-500 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20' 
                          : 'text-black hover:text-black hover:bg-blue-100 border border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat interface
          <div className="min-h-screen flex flex-col">
            <div className="flex-1 pt-20">
              <div className="max-w-3xl mx-auto w-full space-y-8 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide pt-8">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    {message.type === "user" ? (
                      <div className={`max-w-[85vw] sm:max-w-xl rounded-2xl px-6 py-2 backdrop-blur-sm border text-sm font-light leading-relaxed break-words whitespace-pre-line ${darkModeClasses.userBubble}`}>
                        <p>{message.content}</p>
                      </div>
                    ) : (
                      <MarkdownMessage
                        content={message.content}
                        isDarkMode={isDarkMode}
                        currentColor={currentColor}
                      />
                    )}
                  </div>
                ))}

                {isDiscovering && (
                  <div className="flex justify-start">
                    <div className="px-6">
                      <p
                        className="text-xs font-light transition-all duration-3000 ease-in-out"
                        style={{
                          color: currentColor.text,
                          textShadow: `0 0 8px ${currentColor.glow}`,
                        }}
                      >
                        Discovering...
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed input at bottom */}
            <div ref={inputRef} className={`fixed bottom-20 left-0 right-0 px-8 pb-8 pt-2 ${darkModeClasses.gradientBg}`}>
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Ask me anything"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={`w-full h-20 px-16 py-4 text-sm border rounded-2xl resize-none focus:ring-0 focus:outline-none font-light backdrop-blur-sm transition-all duration-3000 ease-in-out ${darkModeClasses.inputBg}`}
                    style={{
                      boxShadow: `0 0 0 1px rgba(255,255,255,0.1), 0 0 20px ${currentColor.glow}`,
                      paddingTop: '1.5rem',
                      paddingBottom: '0.5rem',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLTextAreaElement).style.boxShadow = `0 0 0 1px rgba(255,255,255,0.2), 0 0 30px ${currentColor.glow}`
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLTextAreaElement).style.boxShadow = `0 0 0 1px rgba(255,255,255,0.1), 0 0 20px ${currentColor.glow}`
                    }}
                    onKeyDown={handleKeyDown}
                  />

                  <Button
                    size="sm"
                    variant="ghost"
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 transition-colors ${darkModeClasses.buttonHover}`}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className={`absolute right-16 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 transition-colors ${darkModeClasses.buttonHover}`}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    disabled={!prompt.trim() || isDiscovering}
                    onClick={handleSubmit}
                    className={`absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 p-0 rounded-xl transition-all duration-300 ${darkModeClasses.sendButton}`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer - only on landing page */}
      {messages.length === 0 && !isDiscovering && (
        <footer className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className={`text-xs font-light ${darkModeClasses.textSecondary}`}>
              Copyright &copy; 2025 Discovery. All rights reserved. 
              <a href="#" className={`underline mx-1 ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>Privacy Policy</a> |
              <a href="#" className={`underline mx-1 ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>Terms of Use</a>
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
