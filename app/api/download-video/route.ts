// app/api/download-video/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { gcsUrl, geminiApiKey } = await request.json();

    if (!gcsUrl || !geminiApiKey) {
      return NextResponse.json(
        { error: 'Missing gcsUrl or geminiApiKey' },
        { status: 400 }
      );
    }

    console.log('[Download] Fetching video from GCS...');

    // Add API key to GCS URL for authentication
    const urlWithKey = gcsUrl.includes('?') 
      ? `${gcsUrl}&key=${geminiApiKey}`
      : `${gcsUrl}?key=${geminiApiKey}`;

    const response = await fetch(urlWithKey);

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    // Stream the video response back to client
    const buffer = await response.arrayBuffer();
    
    console.log(`[Download] Video downloaded: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Download failed'
      },
      { status: 500 }
    );
  }
}