import { embedQuery } from './azureOpenAI'

export interface SearchResult {
  content: string
  filename: string
  score: number
  path?: string
}

export interface SearchResponse {
  hits: SearchResult[]
  totalCount: number
}

const AZURE_SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT!
const AZURE_SEARCH_API_KEY = process.env.AZURE_SEARCH_API_KEY!
const AZURE_SEARCH_INDEX = process.env.AZURE_SEARCH_INDEX!

export async function searchKb(query: string, k: number = 3): Promise<SearchResponse> {
  try {
    const vector = await embedQuery(query)
    const url = `${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX}/docs/search?api-version=2023-11-01`
    
    // Build the search request body
    const body: any = {
      count: true,
      top: k,
      select: "content,metadata_storage_name,metadata_storage_path",
      search: query,
      searchFields: "content"
    }

    // Only add vector search if we got embeddings
    if (vector) {
      body.vectorQueries = [{
        kind: "vector",
        fields: "contentVector",
        vector,
        kNearestNeighborsCount: k
      }]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_SEARCH_API_KEY
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Azure Search API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Transform the results
    const hits: SearchResult[] = (data.value || []).map((doc: any) => ({
      content: doc.content || '',
      filename: doc.metadata_storage_name || 'unknown',
      score: doc['@search.score'] || 0,
      path: doc.metadata_storage_path
    }))

    // Filter out very low-quality matches
    const filteredHits = hits.filter(hit => hit.score > 0.01 && hit.content.trim().length > 20)

    return {
      hits: filteredHits,
      totalCount: data['@odata.count'] || 0
    }

  } catch (error) {
    console.error('Vector search error:', error)
    // Fall back to keyword search
    console.log('🔄 Falling back to keyword search...')
    return await fallbackSearch(query, k)
  }
}

// Fallback search using keyword matching if vector search fails
export async function fallbackSearch(query: string, k: number = 3): Promise<SearchResponse> {
  try {
    const url = `${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX}/docs/search?api-version=2023-11-01`
    
    const body = {
      count: true,
      top: k,
      select: "content,metadata_storage_name,metadata_storage_path",
      search: query,
      searchFields: "content",
      queryType: "simple"
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_SEARCH_API_KEY
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Azure Search API error: ${response.status}`)
    }

    const data = await response.json()
    
    const hits: SearchResult[] = (data.value || []).map((doc: any) => ({
      content: doc.content || '',
      filename: doc.metadata_storage_name || 'unknown',
      score: doc['@search.score'] || 0,
      path: doc.metadata_storage_path
    }))

    return {
      hits: hits.filter(hit => hit.content.trim().length > 50),
      totalCount: data['@odata.count'] || 0
    }

  } catch (error) {
    console.error('Fallback search error:', error)
    return {
      hits: [],
      totalCount: 0
    }
  }
}

// Check if search results are sufficient for answering
export function isSearchQualityGood(hits: SearchResult[]): boolean {
  if (hits.length === 0) return false
  
  // Check if top result has good confidence
  const topScore = hits[0].score
  if (topScore < 0.05) return false  // Lowered from 0.15 to 0.05
  
  // Check if we have enough content
  const totalContent = hits.reduce((sum, hit) => sum + hit.content.length, 0)
  if (totalContent < 100) return false  // Lowered from 200 to 100
  
  return true
} 