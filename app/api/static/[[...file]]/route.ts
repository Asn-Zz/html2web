import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = [
    "cle1",
    "iad1",
    "pdx1",
    "sfo1",
    "sin1",
    "syd1",
    "hnd1",
    "kix1",
];

async function handler(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.getAll("file");
    searchParams.delete("file");
    const params = searchParams.toString();
        
    if (!path.length) {
        return NextResponse.json({ error: "Missing file query parameter." }, { status: 400 });
    }

    const targetUrl = `${process.env.NEXT_PUBLIC_COS_URL_PREFIX}/${path.join('/')}${params ? `?${params}` : ''}`;    

    try {      
        const response = await fetch(targetUrl);
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    } catch (error) {
        return NextResponse.json({ error: "Missing file or file not found." }, { status: 404 });
    }
}

export { handler as GET, handler as OPTIONS };
