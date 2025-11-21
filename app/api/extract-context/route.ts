// app/api/extract-context/route.ts (IMPROVED VERSION)
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, geminiApiKey } = await request.json();

    if (!prompt || !geminiApiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters (prompt, geminiApiKey)' },
        { status: 400 }
      );
    }

    console.log('[Extract Context] Analyzing scene:', prompt.substring(0, 50));

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp" 
    });
    
    // IMPROVED PROMPT - Chi tiết và specific hơn
    const contextPrompt = `You are a professional cinematographer and visual consistency expert. Your task is to extract EXTREMELY DETAILED visual context from this video scene description to ensure perfect visual consistency across multiple scenes.

Scene description: "${prompt}"

Analyze and provide ULTRA-SPECIFIC details in this EXACT format:

PHYSICAL_SETTING:
- Location type: [indoor/outdoor, room type, specific environment]
- Architecture: [walls, floors, furniture, props - be VERY specific about materials and colors]
- Spatial layout: [where objects are positioned relative to each other]
- Background elements: [what's visible in the background, depth of field]

CHARACTERS:
- Main subjects: [who/what are the main subjects]
- Age/appearance: [specific details about appearance]
- Clothing: [exact colors, styles, materials]
- Position: [where they are in the frame]

LIGHTING_SETUP:
- Primary light source: [window, lamp, natural sun - be specific about direction and quality]
- Light quality: [soft/hard, diffused/direct]
- Light color temperature: [warm (2700K-3500K) / neutral (4000K-5000K) / cool (5500K+)]
- Shadow characteristics: [sharp/soft, direction, intensity]
- Time of day indicator: [morning/afternoon/evening based on light quality]

CAMERA_TECHNICAL:
- Shot type: [extreme wide/wide/medium wide/medium/medium close-up/close-up/extreme close-up]
- Camera height: [high angle/eye level/low angle - specific degrees if possible]
- Camera movement: [static/slow pan left-right/slow tracking/dolly in-out]
- Lens characteristics: [wide angle 24mm / normal 50mm / telephoto 85mm+ effect]
- Depth of field: [shallow (blurred background) / deep (everything in focus)]
- Frame composition: [rule of thirds, centered, etc.]

VISUAL_STYLE:
- Overall aesthetic: [cinematic/documentary/commercial/naturalistic/stylized]
- Mood/atmosphere: [cozy, dramatic, peaceful, energetic, intimate, etc.]
- Film look: [modern digital, film grain, vintage, clean, etc.]
- Motion blur: [present/absent, shutter speed indication]

COLOR_GRADING:
- Primary color palette: [list 3-5 dominant colors with hex codes if possible]
- Saturation level: [highly saturated/moderately saturated/desaturated/muted]
- Contrast level: [high contrast/medium contrast/low contrast/flat]
- Color temperature bias: [warm amber/neutral/cool blue]
- Skin tones: [how skin appears - warm/cool/neutral]
- Secondary colors: [accent colors present in the scene]

CONTINUITY_MARKERS:
- Unique identifiable elements: [specific props, patterns, textures that must remain consistent]
- Spatial relationships: [how elements relate to each other spatially]
- Brand/style markers: [any distinctive visual signatures]

Be EXTREMELY specific. Include exact colors (e.g., "soft cream beige" not just "beige"), exact materials (e.g., "fluffy shag carpet" not just "carpet"), exact positions (e.g., "subject positioned left third of frame" not just "on the left").

The more specific you are, the better the visual consistency will be across scenes.`;

    const result = await model.generateContent(contextPrompt);
    const context = result.response.text();
    
    console.log('[Extract Context] ✓ Successfully extracted detailed context');

    return NextResponse.json({ 
      context,
      success: true 
    });

  } catch (error) {
    console.error('[Extract Context] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to extract context',
        success: false
      },
      { status: 500 }
    );
  }
}