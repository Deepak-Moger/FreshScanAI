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
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid multipart form data' },
      { status: 400 }
    )
  }

  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: 'No file provided' },
      { status: 400 }
    )
  }

  const pythonFormData = new FormData()
  pythonFormData.append('file', file, file.name || 'label-image.jpg')

  try {
    const response = await fetch(`${PYTHON_API_URL}/api/upload`, {
      method: 'POST',
      body: pythonFormData,
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
