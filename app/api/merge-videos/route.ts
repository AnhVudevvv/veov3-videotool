// app/api/merge-videos/route.ts
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
    const { videoUrls, geminiApiKey } = await request.json();

    if (!videoUrls || videoUrls.length === 0) {
      return NextResponse.json(
        { error: 'No video URLs provided' },
        { status: 400 }
      );
    }

    console.log(`[Merge] Starting merge process for ${videoUrls.length} videos`);

    // Step 1: Download all videos from GCS with API key authentication
    const videoBuffers = await Promise.all(
      videoUrls.map(async (url: string, index: number) => {
        console.log(`[Merge] Downloading video ${index + 1}/${videoUrls.length}`);
        
        // Add API key to GCS URL for authentication
        const urlWithKey = url.includes('?') 
          ? `${url}&key=${geminiApiKey}`
          : `${url}?key=${geminiApiKey}`;
        
        const response = await fetch(urlWithKey);
        
        if (!response.ok) {
          throw new Error(`Failed to download video ${index + 1}: ${response.status} ${response.statusText}`);
        }
        
        return Buffer.from(await response.arrayBuffer());
      })
    );

    console.log('[Merge] All videos downloaded successfully');

    // Step 2: Save videos to temp files
    const tempDir = tmpdir();
    const timestamp = Date.now();
    
    const tempVideoFiles = await Promise.all(
      videoBuffers.map(async (buffer, index) => {
        const filePath = join(tempDir, `video_${timestamp}_${index}.mp4`);
        await writeFile(filePath, buffer);
        tempFiles.push(filePath);
        return filePath;
      })
    );

    console.log('[Merge] Videos saved to temp files');

    // Step 3: Create concat list for FFmpeg
    const listFile = join(tempDir, `list_${timestamp}.txt`);
    const listContent = tempVideoFiles
      .map(f => `file '${f.replace(/'/g, "'\\''")}'`)
      .join('\n');
    
    await writeFile(listFile, listContent);
    tempFiles.push(listFile);

    console.log('[Merge] Concat list created');

    // Step 4: Output file
    const outputFile = join(tempDir, `merged_${timestamp}.mp4`);
    tempFiles.push(outputFile);

    // Step 5: Merge videos with FFmpeg
    // Using -c copy for fast merging without re-encoding
    console.log('[Merge] Starting FFmpeg merge...');
    
    const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`;
    
    try {
      await execAsync(ffmpegCommand);
      console.log('[Merge] FFmpeg merge completed successfully');
    } catch (error: any) {
      console.error('[Merge] FFmpeg error:', error);
      throw new Error(`FFmpeg failed: ${error.message}`);
    }

    // Step 6: Read merged file
    const mergedBuffer = await readFile(outputFile);
    console.log(`[Merge] Merged video size: ${(mergedBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Step 7: Cleanup temp files
    await Promise.all(tempFiles.map(f => unlink(f).catch(() => {})));
    console.log('[Merge] Temp files cleaned up');

    // Step 8: Return merged video
    return new NextResponse(mergedBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="merged_video_${videoUrls.length}scenes_${timestamp}.mp4"`,
        'Content-Length': mergedBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('[Merge] Video merge error:', error);
    
    // Cleanup temp files on error
    await Promise.all(tempFiles.map(f => unlink(f).catch(() => {})));
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Merge failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}