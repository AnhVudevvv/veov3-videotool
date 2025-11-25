// app/api/generate-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      geminiApiKey, 
      aspectRatio,
      sceneContext,
      lastFrameImage,
      durationSeconds = 8
    } = body;

    if (!prompt || !geminiApiKey || !aspectRatio) {
      return NextResponse.json(
        { error: 'Missing required parameters (prompt, geminiApiKey, aspectRatio)' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // BUILD ENHANCED PROMPT with globalContext
    let finalPrompt = '';
    
    if (sceneContext && sceneContext.trim()) {
      // Add globalContext BEFORE scene prompt for consistency
      finalPrompt = `${sceneContext}\n\n--- SCENE ---\n${prompt}`;
      console.log(`[API] Using globalContext (${sceneContext.length} chars)`);
    } else {
      finalPrompt = prompt;
    }

    // Add temporal continuity instruction if we have last frame
    if (lastFrameImage) {
      finalPrompt = `[TEMPORAL CONTINUITY] Continue from the previous scene. Maintain visual consistency.\n\n${finalPrompt}`;
    }

    console.log(`[API] Generating video: ${prompt.substring(0, 30)}...`);
    if (lastFrameImage) {
      console.log(`[API] Using last frame for continuity`);
    }

    // Prepare generation config
    const config: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio as '16:9' | '9:16',
    };

    let operation;
    let usedLastFrame = false;

    try {
      // Method 1: Try with referenceImages (Veo 3.1 preferred method for continuity)
      if (lastFrameImage) {
        try {
          console.log(`[API] Attempting with referenceImages...`);
          
          // Clean base64 data
          let base64Data = lastFrameImage;
          if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
          }

          // Determine MIME type
          let mimeType = 'image/jpeg';
          if (lastFrameImage.toLowerCase().includes('png')) {
            mimeType = 'image/png';
          }

          const imageSizeMB = (base64Data.length * 0.75 / 1024 / 1024).toFixed(2);
          console.log(`[API] LastFrame size: ${imageSizeMB}MB, MIME: ${mimeType}`);

          // Structure according to Veo 3.1 API with referenceImages
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            source: {
              prompt: finalPrompt
            },
            config: {
              ...config,
              // KEY: Use referenceImages array for temporal continuity
              referenceImages: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                }
              ]
            }
          } as any);

          usedLastFrame = true;
          console.log('[API] ✓ Generated with temporal continuity');
          
        } catch (imageError: any) {
          console.error('[API] Failed with referenceImages:', imageError.message);
          
          // Fallback: Generate without image
          console.log('[API] Retrying without lastFrame...');
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            source: {
              prompt: finalPrompt
            },
            config: config
          } as any);
          
          usedLastFrame = false;
          console.log('[API] ✓ Retry successful (text-only)');
        }
      } else {
        // No lastFrame provided - standard generation
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-generate-preview',
          source: {
            prompt: finalPrompt
          },
          config: config
        } as any);
        
        console.log('[API] ✓ Standard generation (no continuity)');
      }
      
      console.log('[API] Operation started. Polling...');
      
    } catch (apiError: any) {
      console.error('[API] API Error:', apiError);
      throw new Error(`Generation failed: ${apiError.message}`);
    }

    // Polling loop
    const startTime = Date.now();
    let pollCount = 0;
    
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      pollCount++;
      
      try {
        operation = await ai.operations.getVideosOperation({ operation });
        
        if (pollCount % 3 === 0) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`[API] Polling (${pollCount}) - ${elapsed}s...`);
        }
      } catch (error: any) {
        console.error('[API] Polling error:', error);
        
        if (error.message?.includes('404')) {
          throw new Error('Operation not found - API key may be invalid');
        }
        
        throw new Error('Polling failed: ' + error.message);
      }
      
      // 5 minute timeout
      if (Date.now() - startTime > 300000) {
        throw new Error('Timeout after 5 minutes');
      }
    }

    // Get video URI
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error('No video URI in response');
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`[API] Success. URI: ${videoUri.substring(0, 60)}...`);
    console.log(`[API] Generation time: ${elapsed}s`);
    console.log(`[API] Used lastFrame: ${usedLastFrame}`);
    
    return NextResponse.json({ 
      gcsUrl: videoUri,
      usedTemporalContinuity: usedLastFrame,
      generationTime: elapsed
    });

  } catch (error) {
    console.error('❌ [API Error]:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}