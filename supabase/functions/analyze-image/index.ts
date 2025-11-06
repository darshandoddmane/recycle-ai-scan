import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Converting image data...');
    
    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate unique filename
    const filename = `scan-${Date.now()}.jpg`;
    const filePath = `${filename}`;

    console.log('Uploading image to storage...');
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('scan-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('scan-images')
      .getPublicUrl(filePath);

    console.log('Analyzing image with Gemini...');

    // Call Gemini API via Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and determine if the item(s) in it are recyclable. 
                
Respond with a JSON object containing:
- is_recyclable: boolean (true if recyclable, false if not)
- material_type: string (e.g., "Plastic - PET", "Paper - Cardboard", "Metal - Aluminum", "Glass", "Not Recyclable", etc.)
- confidence: number between 0 and 1
- explanation: brief explanation of why it is or isn't recyclable

Be specific about the material type when possible. If you can't clearly identify the material, set confidence lower.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error('Failed to analyze image');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No analysis result from AI');
    }

    console.log('AI response:', content);

    // Parse the JSON response from Gemini
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback if parsing fails
      analysisResult = {
        is_recyclable: false,
        material_type: 'Unknown',
        confidence: 0.5,
        explanation: content
      };
    }

    console.log('Saving results to database...');

    // Save to database
    const { data: scanData, error: dbError } = await supabase
      .from('image_scans')
      .insert({
        image_path: filePath,
        image_url: publicUrl,
        is_recyclable: analysisResult.is_recyclable,
        material_type: analysisResult.material_type,
        confidence: analysisResult.confidence,
        analysis_result: analysisResult
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Analysis complete!');

    return new Response(
      JSON.stringify({
        success: true,
        scan: scanData,
        analysis: analysisResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
