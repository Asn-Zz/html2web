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
  return pathSegments[1] || '';
}

/**
 * GET /api/cos/files/[...key]
 * - If key is a folder (ends with /) or empty, lists contents.
 * - If key is a file, downloads the file.
 */
async function getHandler(request: NextRequest) {
  const key = getKeyFromParams(request);
  if (!key) {
    return NextResponse.json({ error: 'A key is required to create a resource.' }, { status: 400 });
  }
  const isListingRequest = !key.includes('/');  

  try {
    if (isListingRequest) {
      const result = await cosService.listFiles(key === 'all' ? '' : key);
      return NextResponse.json(result);
    } else {
      // Use the new service method to get the file payload
      const { body, contentType } = await cosService.getFilePayload(key);
      const fileName = key.split('/').pop() || 'download';
      
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

      // NextResponse can be constructed directly from a Buffer
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
 * - If key ends with /, creates a new folder.
 * - If key is a file path, uploads a file (from request body).
 */
async function postHandler(request: NextRequest) {
  const key = getKeyFromParams(request);
  if (!key) {
    return NextResponse.json({ error: 'A key is required to create a resource.' }, { status: 400 });
  }

  const isFolderCreation = !key.includes('/');

  try {
    if (isFolderCreation) {
      await cosService.createFolder(key);
      return NextResponse.json({ message: `Folder '${key}' created successfully.` }, { status: 201 });
    } else {
      // Convert the incoming request body to a Buffer
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
 * - Deletes a file or an entire folder.
 */
async function deleteHandler(request: NextRequest) {
  const key = getKeyFromParams(request);
  if (!key) {
    return NextResponse.json({ error: 'A key is required to delete a resource.' }, { status: 400 });
  }

  const isFolderDeletion = !key.includes('/');

  try {
    if (isFolderDeletion) {
      await cosService.deleteFolder(key);
      return NextResponse.json({ message: `Folder '${key}' and its contents deleted successfully.` });
    } else {
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