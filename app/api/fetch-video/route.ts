// app/api/fetch-video/route.ts
// (Tạo file mới ở vị trí này)

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    // Lấy key từ header (an toàn hơn là query param)
    const apiKey = request.headers.get('Authorization')?.split(' ')[1];

    if (!url || !apiKey) {
      return NextResponse.json(
        { error: 'Missing url or authorization' },
        { status: 400 }
      );
    }

    // Thêm API key vào GCS URL để xác thực
    const gcsUrlWithKey = `${url}&key=${apiKey}`;

    console.log('[Proxy] Đang tải video từ GCS...');
    const videoResponse = await fetch(gcsUrlWithKey);

    if (!videoResponse.ok) {
      throw new Error(
        `[Proxy] Failed to download video blob: ${videoResponse.statusText}`
      );
    }
    
    // Stream video về client
    // Đây là cách hiệu quả nhất để xử lý file lớn
    return new Response(videoResponse.body, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="scene.mp4"',
      },
    });

  } catch (error) {
    console.error('❌ [Proxy] Lỗi tải video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}