'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'
import { Send, MessageCircle } from 'lucide-react'
import { toast } from './ui/use-toast'
import { notifyNewMessage, requestNotificationPermission } from '@/lib/notifications'
import { cn } from '@/lib/utils'

interface ChatBoxProps {
  claimId: number
  currentUserId: string
  currentUserName?: string
  otherUserName: string
  borderless?: boolean
}

interface Message {
  id: number
  claimId: number
  senderId: string
  content: string
  createdAt: string
  sender?: {
    id: string
    name: string | null
    email: string
  }
}

export function ChatBox({ claimId, currentUserId, currentUserName = 'You', otherUserName, borderless = false }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?claimId=${claimId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (e) {
      console.error('Error fetching messages:', e)
    }
  }

  useEffect(() => {
    requestNotificationPermission()
    fetchMessages()

    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [claimId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || loading) return

    setLoading(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          content: newMessage.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to send message')
      }

      setNewMessage('')
      await fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={cn("w-full", borderless ? "border-0 shadow-none bg-transparent" : "glass-card border-primary/10 rounded-2xl shadow-lg overflow-hidden")}>
      {!borderless && (
        <CardHeader className="border-b border-border/40 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <MessageCircle className="h-4 w-4" />
            </div>
            Chat with {otherUserName}
          </CardTitle>
          <CardDescription className="text-xs">
            Discuss details about the item claim
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn("p-4 sm:p-6", borderless && "p-0 pt-4")}>
        <ScrollArea className="h-[380px] pr-4 mb-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <MessageCircle className="h-10 w-10 text-muted-foreground/45 mb-2" />
                <p className="text-sm font-semibold">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation to discuss claiming details.</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = (message.senderId || (message as any).sender_id) === currentUserId
                const createdAt = message.createdAt || (message as any).created_at
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-7 w-7 border border-primary/10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {isCurrentUser ? currentUserName[0]?.toUpperCase() : otherUserName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col gap-1 max-w-[75%] ${
                        isCurrentUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-muted-foreground leading-none">
                        {isCurrentUser ? currentUserName : otherUserName}
                      </span>
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm shadow-sm leading-relaxed ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-muted text-foreground rounded-tl-none border border-border/40'
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground px-1">
                        {new Date(createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border/40 pt-4">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={1000}
            disabled={loading}
            className="bg-background/50 border-primary/10 focus-visible:ring-primary h-11"
          />
          <Button type="submit" size="icon" className="brand-button-hover bg-primary text-primary-foreground shrink-0 h-11 w-11 rounded-xl" disabled={loading || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
