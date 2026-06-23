import { NextRequest, NextResponse } from 'next/server'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000'

async function readBackendJson(response: Response) {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    return {
      success: false,
      error: text || `Python backend returned HTTP ${response.status}`,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    const response = await fetch(`${PYTHON_API_URL}/api/predict_webcam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    })

    const data = await readBackendJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Python backend error:', error)
    return NextResponse.json(
      { success: false, error: 'Python backend unavailable' },
      { status: 503 }
    )
  }
}
