// app/api/download-video/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { gcsUrl, geminiApiKey } = await request.json();

    if (!gcsUrl || !geminiApiKey) {
      return NextResponse.json(
        { error: 'Missing GCS URL or API key' },
        { status: 400 }
      );
    }

    console.log('Downloading video from:', gcsUrl);

    // Tải video từ GCS với API key xác thực
    const response = await fetch(gcsUrl, {
      headers: {
        'x-goog-api-key': geminiApiKey,
      },
    });

    if (!response.ok) {
      console.error('GCS download failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to download video: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Lấy video buffer
    const videoBuffer = await response.arrayBuffer();
    
    console.log(`Video downloaded successfully: ${videoBuffer.byteLength} bytes`);

    // Trả về video cho client
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Video download error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Download failed',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}