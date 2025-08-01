"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, User, ArrowLeft, Mic, Paperclip, Moon } from "lucide-react";
//import { ChatTest } from "@/components/chat-test"

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface ChatHistoryItem {
  id: number;
  title: string;
  time: string;
}

const COLORS = [
  { glow: "rgba(139, 92, 246, 0.6)", text: "rgb(139, 92, 246)" },
  { glow: "rgba(59, 130, 246, 0.6)", text: "rgb(59, 130, 246)" },
  { glow: "rgba(16, 185, 129, 0.6)", text: "rgb(16, 185, 129)" },
  { glow: "rgba(245, 158, 11, 0.6)", text: "rgb(245, 158, 11)" },
  { glow: "rgba(236, 72, 153, 0.6)", text: "rgb(236, 72, 153)" },
  { glow: "rgba(99, 102, 241, 0.6)", text: "rgb(99, 102, 241)" },
];

export default function DiscoBuddyLanding() {
  // State
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [messageIdCounter, setMessageIdCounter] = useState(1);
  const [inputHeight, setInputHeight] = useState(0);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Color cycling effect
  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLORS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isDiscovering]);

  // Focus textarea after AI response
  useEffect(() => {
    if (!isDiscovering && messages.length > 0) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isDiscovering, messages.length]);

  // Update input height for dynamic padding
  useEffect(() => {
    if (inputRef.current) {
      setInputHeight(inputRef.current.offsetHeight);
    }
  }, [prompt, isDiscovering]);

  const askQuestion = async (question: string): Promise<string> => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      return data.response || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error("Error asking question:", error);
      return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    const userMessage: Message = {
      id: messageIdCounter,
      type: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessageId = messageIdCounter;
    setMessageIdCounter((prev) => prev + 1);
    setIsDiscovering(true);

    const currentPrompt = prompt;
    setPrompt("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await askQuestion(currentPrompt);
      setIsDiscovering(false);

      const aiMessage: Message = {
        id: currentMessageId + 1,
        type: "ai",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setMessageIdCounter((prev) => prev + 1);
    } catch (error) {
      setIsDiscovering(false);
      const errorMessage: Message = {
        id: currentMessageId + 1,
        type: "ai",
        content:
          "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setMessageIdCounter((prev) => prev + 1);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setIsDiscovering(false);
    setMessageIdCounter(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isDiscovering) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentColor = COLORS[colorIndex];

  // Dark mode conditional classes
  const darkModeClasses = {
    bg: isDarkMode ? "bg-black" : "bg-background",
    text: isDarkMode ? "text-white" : "text-black",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-white/10" : "border-black/5",
    headerBg:
      isDarkMode ? "bg-black/80 border-white/10" : "bg-white/80 border-black/5",
    sidebarBg: isDarkMode
      ? "linear-gradient(to bottom, #1f2937, #111827)"
      : "linear-gradient(to bottom, #f9fafb, #e5e7eb)",
    inputBg: isDarkMode
      ? "bg-white/5 border-white/10 focus:border-white/20 placeholder:text-gray-500 text-white"
      : "bg-white border-blue-100 focus:border-blue-200 placeholder:text-gray-500 text-black",
    buttonHover: isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-black",
    sendButton: isDarkMode
      ? "bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-600 text-white"
      : "bg-white hover:bg-gray-100 disabled:bg-white/10 disabled:text-gray-600 text-black",
    userBubble: isDarkMode
      ? "text-white bg-gray-400/30 border-gray-500/30"
      : "text-black bg-blue-100 border-blue-200",
    gradientBg: isDarkMode
      ? "bg-gradient-to-t from-black via-black/90 to-transparent"
      : "bg-gradient-to-t from-white via-white/90 to-transparent",
  };

  return (
    <div className={`min-h-screen ${darkModeClasses.bg} ${darkModeClasses.text}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${darkModeClasses.border}`}>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">DiscoBuddy</h1>
          <span className="text-sm rounded-full px-3 py-1" style={{ backgroundColor: currentColor.text }}>
            Beta
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={resetChat}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsDarkMode((prev) => !prev)}>
            <Moon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Chat history (sidebar) */}
      <div className={`fixed inset-y-0 left-0 w-80 p-4 overflow-y-auto border-r ${darkModeClasses.border} ${sidebarOpen ? 'block' : 'hidden'}`}>
        <h2 className="text-lg font-semibold mb-4">Chat History</h2>
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No chat history</p>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id} className={`p-3 rounded-lg ${message.type === 'user' ? darkModeClasses.userBubble : 'bg-gray-100'} border`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${darkModeClasses.textSecondary}`}>
                    {message.type === 'user' ? 'You' : 'DiscoBuddy'} • {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(message.timestamp))}
                  </span>
                </div>
                <p className={`text-sm ${darkModeClasses.text}`}>{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className={`flex-1 p-4 md:ml-80 transition-all duration-300 ${darkModeClasses.gradientBg}`}>
        {/* Message list */}
        <div className="space-y-4 mb-4">
          {messages.map((message) => (
            <div key={message.id} className={`p-3 rounded-lg ${message.type === 'user' ? darkModeClasses.userBubble : 'bg-gray-100'} border`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkModeClasses.textSecondary}`}>
                  {message.type === 'user' ? 'You' : 'DiscoBuddy'} • {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(message.timestamp))}
                </span>
              </div>
              <p className={`text-sm ${darkModeClasses.text}`}>{message.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div ref={inputRef} className={`flex items-center p-4 rounded-lg border ${darkModeClasses.border} ${darkModeClasses.inputBg}`}>
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className={`flex-1 resize-none border-0 focus:ring-0 ${darkModeClasses.text} ${darkModeClasses.placeholder}`}
            style={{ minHeight: `${inputHeight}px` }}
          />
          <Button
            onClick={handleSubmit}
            disabled={isDiscovering}
            className={`ml-2 rounded-full p-2 transition-all duration-300 flex items-center justify-center ${darkModeClasses.sendButton}`}
          >
            {isDiscovering ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4zm16 0a8 8 0 01-8 8v-4a4 4 0 004-4h4z"></path>
              </svg>
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
