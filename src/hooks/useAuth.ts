import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        supabase.auth.signInAnonymously()
      }
    })
  }, [])
}