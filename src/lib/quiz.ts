import {supabase} from './supabase'

export interface QuizScan{
    id: string,
    image_url: string,
    translated_text: string,
    quiz_distractors: string[]
}


export async function getRandomQuizScan(excludeIds: string[]): Promise <QuizScan | null>{
    const {data: userData} = await supabase.auth.getUser()
    const userId = userData.user?.id
    if(!userId) return null

    let query: any = supabase
    .from('scans')
    .select('id, image_url, translated_text, quiz_distractors')
    .eq('user_id', userId)
    .not('quiz_distractors', 'is', null)

    if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }

    const {data, error} = await query
    if(error || !data || data.length === 0) return null
    const randomIndex = Math.floor(Math.random()*data.length)
    return(data[randomIndex]) as QuizScan

}

export async function recordQuizAttempt(scanId: string, wasCorrect: boolean){
    const{data: userData} = await supabase.auth.getUser()
    const userId = userData.user?.id
    if(!userId) return null

    await supabase.from('quiz_attempts').insert({
        user_id: userId,
        scan_id: scanId,
        was_correct: wasCorrect
    })
}


