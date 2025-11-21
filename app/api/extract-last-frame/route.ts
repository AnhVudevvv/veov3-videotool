// app/api/extract-last-frame/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    const { videoUrl, geminiApiKey } = await request.json();

    if (!videoUrl || !geminiApiKey) {
      return NextResponse.json(
        { error: 'Missing videoUrl or geminiApiKey' },
        { status: 400 }
      );
    }

    console.log('[Extract Frame] Starting frame extraction...');
    console.log('[Extract Frame] Video URL:', videoUrl.substring(0, 60) + '...');

    // ═══════════════════════════════════════════════
    // STEP 1: DOWNLOAD VIDEO FROM GCS
    // ═══════════════════════════════════════════════
    console.log('[Extract Frame] Downloading video from GCS...');
    
    const response = await fetch(videoUrl, {
      headers: {
        'x-goog-api-key': geminiApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    const videoBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`[Extract Frame] Downloaded ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // ═══════════════════════════════════════════════
    // STEP 2: SAVE TO TEMP FILE
    // ═══════════════════════════════════════════════
    const tempDir = tmpdir();
    const timestamp = Date.now();
    const videoPath = join(tempDir, `video_${timestamp}.mp4`);
    const imagePath = join(tempDir, `frame_${timestamp}.jpg`);
    
    tempFiles.push(videoPath, imagePath);
    
    await writeFile(videoPath, videoBuffer);
    console.log('[Extract Frame] Video saved to temp file');

    // ═══════════════════════════════════════════════
    // STEP 3: EXTRACT LAST FRAME WITH FFMPEG
    // ═══════════════════════════════════════════════
    console.log('[Extract Frame] Extracting last frame with FFmpeg...');

    // Extract frame 0.1 giây trước khi kết thúc (để tránh black frame)
    const ffmpegCommand = `ffmpeg -sseof -0.1 -i "${videoPath}" -vframes 1 -q:v 2 "${imagePath}"`;

    try {
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      console.log('[Extract Frame] FFmpeg completed');
      if (stderr) console.log('[Extract Frame] FFmpeg stderr:', stderr.substring(0, 200));
    } catch (error: any) {
      console.error('[Extract Frame] FFmpeg error:', error);
      throw new Error(`FFmpeg failed: ${error.message}`);
    }

    // ═══════════════════════════════════════════════
    // STEP 4: READ IMAGE & CONVERT TO BASE64
    // ═══════════════════════════════════════════════
    console.log('[Extract Frame] Reading extracted frame...');
    const imageBuffer = await readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    console.log(`[Extract Frame] ✓ Frame extracted: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // ═══════════════════════════════════════════════
    // STEP 5: CLEANUP
    // ═══════════════════════════════════════════════
    await Promise.all(tempFiles.map(f => unlink(f).catch(() => {})));
    console.log('[Extract Frame] Cleanup completed');

    return NextResponse.json({
      success: true,
      imageBase64: base64Image,
      mimeType: 'image/jpeg'
    });

  } catch (error) {
    console.error('[Extract Frame] ❌ Error:', error);
    
    // Cleanup on error
    await Promise.all(tempFiles.map(f => unlink(f).catch(() => {})));
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Frame extraction failed',
        success: false
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';