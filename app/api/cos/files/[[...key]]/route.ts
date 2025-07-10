import { NextRequest, NextResponse } from 'next/server';
import { cosService, withAuth } from '@/lib/cos';

/**
 * Helper to get the full object key from the request URL.
 * This avoids the Next.js linter issue with using the `params` object directly.
 * e.g., https://.../api/cos/files/folder/file.txt -> "folder/file.txt"
 */
function getKeyFromParams(request: NextRequest): string {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/api/cos/files/');
  // If the key is empty (root), we return an empty string.
  return pathSegments[1] || '';
}

/**
 * GET /api/cos/files/[...key]
 * - To list contents: ?type=folder
 * - To download a file: ?type=file (or omit type)
 */
async function getHandler(request: NextRequest) {
  const key = getKeyFromParams(request);
  // CHANGE: Determine action based on 'type' query parameter, not the key's content.
  const type = request.nextUrl.searchParams.get('type');

  try {
    if (type === 'folder') {
      // List contents of the given key (prefix). An empty key lists the root.
      const result = await cosService.listFiles(key);
      return NextResponse.json(result);
    } else {
      // Default action is to get a file.
      if (!key) {
        return NextResponse.json({ error: 'A key is required to download a file.' }, { status: 400 });
      }
      const { body, contentType } = await cosService.getFilePayload(key);
      const fileName = key.split('/').pop() || 'download';
      
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

      return new NextResponse(body, { status: 200, headers });
    }
  } catch (error: any) {
    if (error.message?.includes('NoSuchKey')) {
        return NextResponse.json({ error: `Object not found: ${key}` }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/cos/files/[...key]
 * - To create a folder: ?type=folder
 * - To upload a file: ?type=file (or omit type)
 */
async function postHandler(request: NextRequest) {
  const key = getKeyFromParams(request);
  if (!key) {
    return NextResponse.json({ error: 'A key is required to create a resource.' }, { status: 400 });
  }
  // CHANGE: Determine action based on 'type' query parameter.
  const type = request.nextUrl.searchParams.get('type');

  try {
    if (type === 'folder') {
      await cosService.createFolder(key);
      return NextResponse.json({ message: `Folder '${key}' created successfully.` }, { status: 201 });
    } else {
      // Default action is to upload a file.
      const arrayBuffer = await request.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        return NextResponse.json({ error: 'Cannot upload an empty file.' }, { status: 400 });
      }
      await cosService.uploadFile(key, buffer);
      return NextResponse.json({ message: `File '${key}' uploaded successfully.` }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/cos/files/[...key]
 * - To delete a folder: ?type=folder
 * - To delete a file: ?type=file (or omit type)
 */
async function deleteHandler(request: NextRequest) {
  const key = getKeyFromParams(request);
  if (!key) {
    return NextResponse.json({ error: 'A key is required to delete a resource.' }, { status: 400 });
  }
  // CHANGE: Determine action based on 'type' query parameter.
  const type = request.nextUrl.searchParams.get('type');

  try {
    if (type === 'folder') {
      await cosService.deleteFolder(key);
      return NextResponse.json({ message: `Folder '${key}' and its contents deleted successfully.` });
    } else {
      // Default action is to delete a file.
      await cosService.deleteFile(key);
      return NextResponse.json({ message: `File '${key}' deleted successfully.` });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Export the wrapped handlers
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);