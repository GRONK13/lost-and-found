'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  claim_id: number
  sender_id: string
  content: string
  created_at: string
}

export function ChatBox({ claimId, currentUserId, currentUserName = 'You', otherUserName, borderless = false }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [itemTitle, setItemTitle] = useState<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission()
    
    fetchMessages()
    fetchItemTitle()
    
    // Mark messages as read for this claim (messages not sent by current user)
    markMessagesAsRead()
    
    // Subscribe to new messages using Supabase Realtime
    const channel = supabase
      .channel(`claim-${claimId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `claim_id=eq.${claimId}`,
        },
        (payload) => {
          console.log('New message received:', payload)
          const newMsg = payload.new as Message
          setMessages((current) => [...current, newMsg])
          
          // If message is from another user, show notification
          if (newMsg.sender_id !== currentUserId) {
            markMessageAsRead(newMsg.id)
            // Show browser notification
            notifyNewMessage(otherUserName, newMsg.content, itemTitle || 'Lost & Found Item')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [claimId])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
  }

  const fetchItemTitle = async () => {
    // Fetch the item title for this claim
    const { data } = await supabase
      .from('claims')
      .select('items(title)')
      .eq('id', claimId)
      .single()

    if (data?.items && typeof data.items === 'object' && 'title' in data.items) {
      setItemTitle(data.items.title as string)
    }
  }

  const markMessagesAsRead = async () => {
    // Mark all unread messages in this claim as read (except those sent by current user)
    console.log('📖 Marking messages as read for claim:', claimId)
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('claim_id', claimId)
      .eq('read', false)
      .neq('sender_id', currentUserId)
      .select()
    
    console.log('📖 Marked messages:', data, 'Error:', error)
  }

  const markMessageAsRead = async (messageId: number) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || loading) return

    setLoading(true)

    try {
      const { error } = await supabase.from('messages').insert({
        claim_id: claimId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage('')
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
                const isCurrentUser = message.sender_id === currentUserId
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
                        {new Date(message.created_at).toLocaleTimeString([], {
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
