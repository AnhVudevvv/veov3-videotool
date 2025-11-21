// app/api/generate-video/route.ts (FIXED - STRONGER ENFORCEMENT)
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      geminiApiKey, 
      seed, 
      aspectRatio,
      sceneContext,
      isFirstScene,
      referenceImage,
      durationSeconds = 8
    } = body;

    console.log('[API] Request:', {
      promptLength: prompt?.length,
      hasApiKey: !!geminiApiKey,
      aspectRatio,
      isFirstScene,
      hasContext: !!sceneContext,
      hasReferenceImage: !!referenceImage,
      durationSeconds
    });

    if (!prompt || !geminiApiKey || !aspectRatio) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    // ═══════════════════════════════════════════════════════════
    // CRITICAL: BUILD ULTRA-STRICT PROMPT
    // ═══════════════════════════════════════════════════════════
    let finalPrompt = prompt;
    
    if (sceneContext && !isFirstScene) {
      // SUPER STRICT ENFORCEMENT
      finalPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL REQUIREMENT - THIS IS MANDATORY ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST REPLICATE THIS EXACT VISUAL CONTEXT:

${sceneContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 FORBIDDEN CHANGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT change:
❌ Environment/room/location
❌ Lighting setup, direction, color temperature
❌ Camera angle, height, lens
❌ Character appearance, age, clothing
❌ Furniture, props, background elements
❌ Color grading, visual style
❌ Time of day indication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ONLY CHANGE THIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${prompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 INSTRUCTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the EXACT SAME SHOT from the previous scene.
The camera has NOT moved.
The lighting has NOT changed.
The environment is IDENTICAL.
Only the character's action/position changes.

Think of this as a continuous single shot where only the subject moves.`;

      console.log('[API] 🔒 Using STRICT context enforcement');
      console.log('[API] Context preview:', sceneContext.substring(0, 200) + '...');
    }

    // Build config
    const config: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio as '16:9' | '9:16',
      randomSeed: seed ? parseInt(seed) : undefined,
      durationSeconds: durationSeconds || 8,
    };

    // Add reference image if available
    if (referenceImage && !isFirstScene) {
      config.referenceImage = {
        imageData: referenceImage,
      };
      console.log('[API] 🖼️ Using reference image for continuity');
    }

    console.log('[API] 📹 Calling Veo API...');

    // Generate video
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: finalPrompt,
      config: config,
    });

    console.log('[API] ⏳ Polling for completion...');

    // Polling loop
    let pollCount = 0;
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      pollCount++;
      
      try {
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
        console.log(`[API] Poll ${pollCount}: ${operation.done ? 'Complete' : 'In Progress'}`);
      } catch (error) {
        console.error('[API] Polling error:', error);
        if (error instanceof Error && error.message.includes("404")) {
          throw new Error("Operation not found. API key may be invalid.");
        }
        throw new Error('Polling failed');
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error('Video generation failed: No download link found.');
    }

    console.log('[API] ✅ Video generated successfully');
    console.log('[API] URL:', downloadLink.substring(0, 60) + '...');

    return NextResponse.json({ 
      gcsUrl: downloadLink,
      success: true,
      usedContext: !isFirstScene && !!sceneContext,
      usedReferenceImage: !isFirstScene && !!referenceImage
    });

  } catch (error) {
    console.error('❌ [API] Error:', error);
    
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';