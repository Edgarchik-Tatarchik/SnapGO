import { supabase } from './supabase'

export async function subscribeToPush(): Promise<boolean> {
    try{
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push not supported')
            return false
        }
        const permission = await Notification.requestPermission()
        if(permission !== 'granted') return false
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                import.meta.env.VITE_VAPID_PUBLIC_KEY
            )
        })
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id
        if(!userId) return false

        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                userId
            })
        })
        return response.ok
    }catch(err){
        console.error('Subscribe error: ', err)
        return false 
    }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return true

    await subscription.unsubscribe()

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return false

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    return !error
  } catch (err) {
    console.error('Unsubscribe error:', err)
    return false
  }
}

export async function isPushSubscribed(): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        return !!subscription
    } catch {
        return false
    }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}
