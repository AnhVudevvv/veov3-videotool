// app/api/merge-videos/route.ts
import { NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const tempFiles: string[] = [];
  
  try {
    const { videoUrls, geminiApiKey } = await request.json();

    if (!videoUrls || videoUrls.length === 0) {
      return NextResponse.json(
        { error: 'No video URLs provided' },
        { status: 400 }
      );
    }

    console.log(`Starting merge process for ${videoUrls.length} videos`);

    // Bước 1: Download tất cả video từ GCS với API key xác thực
    const videoBuffers = await Promise.all(
      videoUrls.map(async (url: string, index: number) => {
        console.log(`Downloading video ${index + 1}/${videoUrls.length}`);
        const response = await fetch(url, {
          headers: {
            'x-goog-api-key': geminiApiKey, // ✅ THÊM API KEY
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download video ${index + 1}: ${response.status} ${response.statusText}`);
        }
        
        return Buffer.from(await response.arrayBuffer());
      })
    );

    console.log('All videos downloaded successfully');

    // Bước 2: Lưu các video vào file tạm
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

    console.log('Videos saved to temp files');

    // Bước 3: Tạo file concat list cho FFmpeg
    const listFile = join(tempDir, `list_${timestamp}.txt`);
    const listContent = tempVideoFiles
      .map(f => `file '${f.replace(/'/g, "'\\''")}'`) // Escape single quotes
      .join('\n');
    
    await writeFile(listFile, listContent);
    tempFiles.push(listFile);

    console.log('Concat list created');

    // Bước 4: Output file
    const outputFile = join(tempDir, `merged_${timestamp}.mp4`);
    tempFiles.push(outputFile);

    // Bước 5: Thực hiện ghép video với FFmpeg
    console.log('Starting FFmpeg merge...');
    
    const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`;
    
    try {
      await execAsync(ffmpegCommand);
      console.log('FFmpeg merge completed successfully');
    } catch (error: any) {
      console.error('FFmpeg error:', error);
      throw new Error(`FFmpeg failed: ${error.message}`);
    }

    // Bước 6: Đọc file đã ghép
    const mergedBuffer = await readFile(outputFile);
    console.log(`Merged video size: ${mergedBuffer.length} bytes`);

    // Bước 7: Dọn dẹp file tạm
    await Promise.all(tempFiles.map(f => unlink(f).catch(() => {})));
    console.log('Temp files cleaned up');

    // Bước 8: Trả về video đã ghép
    return new NextResponse(mergedBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="merged_video_${videoUrls.length}scenes_${timestamp}.mp4"`,
        'Content-Length': mergedBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Video merge error:', error);
    
    // Dọn dẹp file tạm trong trường hợp lỗi
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