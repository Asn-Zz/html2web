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

export async function GET(request: NextRequest) {
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
        return new NextResponse(response.body, response);
    } catch (error) {
        return NextResponse.json({ error: "Missing file or file not found." }, { status: 404 });
    }
}
