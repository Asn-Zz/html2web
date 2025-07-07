import { COSService } from './cos-node';
import { NextRequest, NextResponse } from 'next/server';

// Validate that environment variables are set.
if (
  !process.env.NEXT_PUBLIC_COS_SECRET_ID ||
  !process.env.NEXT_PUBLIC_COS_SECRET_KEY ||
  !process.env.NEXT_PUBLIC_COS_BUCKET ||
  !process.env.NEXT_PUBLIC_COS_REGION
) {
  // This error will be thrown at build time or server start if vars are missing.
  throw new Error('COS environment variables are not properly configured.');
}

// Create a single, shared instance of the COSService for efficiency.
export const cosService = new COSService({
  secretId: process.env.NEXT_PUBLIC_COS_SECRET_ID,
  secretKey: process.env.NEXT_PUBLIC_COS_SECRET_KEY,
  bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
  region: process.env.NEXT_PUBLIC_COS_REGION,
});

// Define a type for our route handlers for better type safety.
type RouteHandler = (
  request: NextRequest,
  context: { params: { [key: string]: string | string[] } }
) => Promise<NextResponse>;

/**
 * A higher-order function to wrap route handlers with authorization.
 * It checks for the 'Authorization: asnlee' header.
 * @param handler The route handler to protect.
 * @returns A new route handler with the authorization check.
 */
export function withAuth(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== process.env.NEXT_PUBLIC_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // If authorized, proceed to the original handler.
    return handler(request, context);
  };
}
