"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, User, ArrowLeft, Mic, Paperclip, Moon } from "lucide-react"
//import { ChatTest } from "@/components/chat-test"

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

// ...next step: add the component function and state...
