import { NextRequest, NextResponse } from 'next/server'

export async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  }

  const cosUrl = `${process.env.NEXT_PUBLIC_COS_URL_PREFIX}/${key}`

  try {
    const response = await fetch(cosUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from COS: ${response.statusText}`)
    }
    const data = await response.text()
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain',
      },
    })
  } catch (error) {
    console.error('COS proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch file from COS' }, { status: 500 })
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };