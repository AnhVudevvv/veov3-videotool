// app/api/generate-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Operation } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, geminiApiKey,sceneContext,seed, aspectRatio } = body;

    if (!prompt || !geminiApiKey || !aspectRatio) {
      return NextResponse.json(
        { error: 'Missing required parameters (prompt, geminiApiKey, aspectRatio)' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    let enhancedPrompt = prompt;
    if (sceneContext) {
      enhancedPrompt = `${sceneContext}\n\nContinuing from the previous scene:\n${prompt}`;
    }
    console.log(`[API] Đang tạo video cho: ${prompt.substring(0, 30)}...`);

    // 2. Gọi API Veo
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview', // dùng model (có sự lựa chọn)
      prompt: enhancedPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio as '16:9' | '9:16',
        randomSeed: seed ? parseInt(seed) : undefined,
        // durationSeconds: 30
      }as any,
    });

    console.log('[API] Đang chờ video render (polling)...');

    // 3. Polling để kiểm tra
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Chờ 10 giây
      try {
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      } catch (error) {
        console.error('[API] Lỗi khi polling:', error);
        if (error instanceof Error && error.message.includes("404")) {
          throw new Error("Lỗi Polling: Operation không tìm thấy. API key có thể đã hết hạn hoặc không hợp lệ.");
        }
        throw new Error('Lỗi trong quá trình polling');
      }
    }

    // 4. Lấy link tải video (đây là link GCS)
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      console.error('[API] Xong, nhưng không tìm thấy link video.');
      throw new Error('Video generation failed: No download link found.');
    }

    console.log('[API] ✓ Đã tạo video. Gửi GCS URL về client.');

    // 5. TRẢ VỀ GCS URL (KHÔNG phải Base64)
    //    Đây là thay đổi quan trọng nhất để tránh lỗi payload size
    return NextResponse.json({ gcsUrl: downloadLink });

  } catch (error) {
    console.error('❌ [API] Lỗi nghiêm trọng:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}