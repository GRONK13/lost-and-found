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

interface ChatBoxProps {
  claimId: number
  currentUserId: string
  currentUserName?: string
  otherUserName: string
}

interface Message {
  id: number
  claim_id: number
  sender_id: string
  content: string
  created_at: string
}

export function ChatBox({ claimId, currentUserId, currentUserName = 'You', otherUserName }: ChatBoxProps) {
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
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('claim_id', claimId)
      .eq('read', false)
      .neq('sender_id', currentUserId)
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with {otherUserName}
        </CardTitle>
        <CardDescription>
          Discuss details about the item claim
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 pr-4 mb-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender_id === currentUserId
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {isCurrentUser ? currentUserName[0]?.toUpperCase() : otherUserName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col gap-1 max-w-xs ${
                        isCurrentUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-xs font-medium mb-1">
                        {isCurrentUser ? currentUserName : otherUserName}
                      </span>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
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

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={1000}
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
