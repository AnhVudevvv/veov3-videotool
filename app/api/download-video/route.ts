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

    const response = await fetch(`${gcsUrl}&key=${geminiApiKey}`);

    if (!response.ok) {
      console.error('Download failed:', response.status);
      return NextResponse.json(
        { error: `Download failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const videoBuffer = await response.arrayBuffer();
    console.log(`Video downloaded: ${videoBuffer.byteLength} bytes`);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}

