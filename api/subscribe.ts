/// <reference types="node" />
export const config = {runtime: 'edge'}

export default async function handler(req: Request){
    if(req.method != 'POST'){
        return new Response('Method now allowed', {status: 405})
    }
    const{subscription, userId} = await req.json()
    if(!subscription || !userId){
        return new Response('Missing subscription or userId',{status: 400})
    }

    const supabaseUrl = (process as any).env.SUPABASE_URL
    const supabaseKey = (process as any).env.SUPABASE_SERVICE_ROLE_KEY
    
    const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`,{
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'resolution=merge-duplicates' 
        },
        body: JSON.stringify({
            user_id: userId,
            subscription,
            last_active_at: new Date().toISOString()
        })
    })
    if(!response.ok){
        const error = await response.text()
        console.error('Supabase error: ', error)
        return new Response('Failed to save subscription', {status:500})
    }
    return new Response('OK', {status: 200})
}