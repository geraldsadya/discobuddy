// Azure Translator API configuration
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY!
const AZURE_TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT!
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION!

// Detect language of input text
export async function detectLanguage(text: string): Promise<string> {
  try {
    const response = await fetch(`${AZURE_TRANSLATOR_ENDPOINT}/detect?api-version=3.0`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
        'Content-type': 'application/json',
      },
      body: JSON.stringify([{ Text: text }]),
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    return data[0]?.language || 'en'
  } catch (error) {
    console.error('Language detection error:', error)
    return 'en' // Default to English on error
  }
}

// Translate text from source language to target language
export async function translate(text: string, from: string, to: string): Promise<string> {
  try {
    const response = await fetch(
      `${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=${from}&to=${to}`, 
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
          'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
          'Content-type': 'application/json',
        },
        body: JSON.stringify([{ Text: text }]),
      }
    )

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    return data[0]?.translations[0]?.text || text
  } catch (error) {
    console.error('Translation error:', error)
    return text // Return original text on error
  }
} 