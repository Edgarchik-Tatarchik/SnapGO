import {supabase} from './supabase'

export async function saveCorrection(
  scanId: string,
  correctedText: string
): Promise<void> {
  const { error } = await supabase
    .from('corrections')
    .insert({ scan_id: scanId, corrected_text: correctedText })

  if (error) console.error('Correction error:', error)

  
  await supabase
    .from('accuracy_stats')
    .insert({ scan_id: scanId, was_corrected: true })
}
export async function saveScan(
    imageData: string,
    ocrText: string,
    translatedText: string,
    distractors: string[],
    relatedWords: {japanese: string, english: string}[]
): Promise<string | null> {
  const blob = await fetch(imageData).then(r => r.blob())
  const fileName = `${Date.now()}.jpg`

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return null

  const { error: uploadError } = await supabase.storage
    .from('signs')
    .upload(`${userId}/${fileName}`, blob, { contentType: 'image/jpeg' })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return null
}
 const { data: urlData } = supabase.storage
    .from('signs')
    .getPublicUrl(`${userId}/${fileName}`)

    const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id: userId,
      image_url: urlData.publicUrl,
      ocr_text: ocrText,
      translated_text: translatedText,
      quiz_distractors: distractors.length === 2 ? distractors: null,
      related_words: relatedWords.length > 0 ? relatedWords : null
    })
    .select('id')
    .single()

  if (error) {
    console.error('DB error:', error)
    return null
  }

  
  return data.id
  
}


export async function deleteScan(scanId: string, imageUrl: string): Promise<boolean>{
  const storagePath = imageUrl.match(/\/signs\/(.+)$/)?.[1]
  if(storagePath){
    const{error: storageError} = await supabase.storage
    .from('signs')
    .remove([storagePath])
    if(storageError){
      console.error('Storage delete error: ', storageError)
    }
  }
    const {error} = await supabase.from('scans').delete().eq('id',scanId)
    if(error){
      console.error('DB delete error:', error)
      return false
    }
    return true
}

