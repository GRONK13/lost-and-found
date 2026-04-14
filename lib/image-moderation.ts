export interface ImageModerationResult {
  isInappropriate: boolean
  nsfwScore: number
  topLabel: string
  provider: string
  reason?: string
}

const HUGGINGFACE_MODEL_URL =
  'https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection'

function normalizePredictions(payload: any): Array<{ label: string; score: number }> {
  if (!Array.isArray(payload)) {
    return []
  }

  if (payload.length > 0 && Array.isArray(payload[0])) {
    return payload[0]
  }

  return payload
}

export async function moderateImageUrl(imageUrl: string): Promise<ImageModerationResult> {
  const token = process.env.HUGGINGFACE_API_TOKEN
  const threshold = Number(process.env.IMAGE_MODERATION_NSFW_THRESHOLD || '0.75')

  if (!token) {
    return {
      isInappropriate: false,
      nsfwScore: 0,
      topLabel: 'unavailable',
      provider: 'none',
      reason: 'HUGGINGFACE_API_TOKEN is not set',
    }
  }

  try {
    const imageResponse = await fetch(imageUrl)

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image (${imageResponse.status})`)
    }

    const imageType = imageResponse.headers.get('content-type') || 'application/octet-stream'
    const imageBytes = await imageResponse.arrayBuffer()

    const moderationResponse = await fetch(HUGGINGFACE_MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': imageType,
      },
      body: Buffer.from(imageBytes),
    })

    if (!moderationResponse.ok) {
      const responseText = await moderationResponse.text()
      throw new Error(`Moderation API error (${moderationResponse.status}): ${responseText}`)
    }

    const moderationPayload = await moderationResponse.json()
    const predictions = normalizePredictions(moderationPayload)

    if (!predictions.length) {
      return {
        isInappropriate: false,
        nsfwScore: 0,
        topLabel: 'unknown',
        provider: 'huggingface/falconsai-nsfw',
        reason: 'No predictions returned by moderation provider',
      }
    }

    const sortedPredictions = [...predictions].sort((a, b) => b.score - a.score)
    const topPrediction = sortedPredictions[0]

    const nsfwPrediction = sortedPredictions.find((item) =>
      item.label.toLowerCase().includes('nsfw')
    )

    const nsfwScore = nsfwPrediction?.score || 0
    const topLabel = topPrediction.label

    return {
      isInappropriate: nsfwScore >= threshold,
      nsfwScore,
      topLabel,
      provider: 'huggingface/falconsai-nsfw',
    }
  } catch (error) {
    console.error('Image moderation failed:', error)

    return {
      isInappropriate: false,
      nsfwScore: 0,
      topLabel: 'error',
      provider: 'huggingface/falconsai-nsfw',
      reason: 'Moderation request failed; item treated as safe by fallback',
    }
  }
}
