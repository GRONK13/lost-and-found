export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'user' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
        }
      }
      items: {
        Row: {
          id: number
          title: string
          description: string
          category: 'ID' | 'Gadget' | 'Book' | 'Clothing' | 'Other'
          status: 'lost' | 'found' | 'claimed' | 'returned'
          location: string | null
          campus: 'TC' | 'MC' | null
          photo_url: string | null
          reporter_id: string
          created_at: string
          updated_at: string
          hidden: boolean
        }
        Insert: {
          id?: number
          title: string
          description: string
          category: 'ID' | 'Gadget' | 'Book' | 'Clothing' | 'Other'
          status?: 'lost' | 'found' | 'claimed' | 'returned'
          location?: string | null
          campus?: 'TC' | 'MC' | null
          photo_url?: string | null
          reporter_id: string
          created_at?: string
          updated_at?: string
          hidden?: boolean
        }
        Update: {
          id?: number
          title?: string
          description?: string
          category?: 'ID' | 'Gadget' | 'Book' | 'Clothing' | 'Other'
          status?: 'lost' | 'found' | 'claimed' | 'returned'
          location?: string | null
          campus?: 'TC' | 'MC' | null
          photo_url?: string | null
          reporter_id?: string
          created_at?: string
          updated_at?: string
          hidden?: boolean
        }
      }
      claims: {
        Row: {
          id: number
          item_id: number
          claimant_id: string
          message: string | null
          status: 'pending' | 'approved' | 'rejected'
          chat_type: 'claim' | 'chat'
          created_at: string
        }
        Insert: {
          id?: number
          item_id: number
          claimant_id: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          chat_type?: 'claim' | 'chat'
          created_at?: string
        }
        Update: {
          id?: number
          item_id?: number
          claimant_id?: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          chat_type?: 'claim' | 'chat'
          created_at?: string
        }
      }
      flags: {
        Row: {
          id: number
          item_id: number
          user_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: number
          item_id: number
          user_id: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          item_id?: number
          user_id?: string
          reason?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: number
          claim_id: number
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          claim_id: number
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          claim_id?: number
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}
