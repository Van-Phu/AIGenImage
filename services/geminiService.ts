import { GoogleGenAI } from "@google/genai";

// Using the correct model for high-quality image editing/generation as per instructions
// "nano banana pro" or "gemini pro image" maps to 'gemini-3-pro-image-preview'
const MODEL_NAME = 'gemini-3-pro-image-preview';

interface EditImageParams {
  base64Image: string;
  mimeType: string;
  prompt: string;
  logoBase64?: string | null;
  logoMimeType?: string;
  imageSize: string; // '1K' | '2K' | '4K'
  apiKey?: string | null; // Allow passing explicit key
}

// Helper to strip sensitive info like API keys from error messages
const sanitizeError = (error: any): string => {
  const msg = error?.message || String(error);
  // Regex to hide potential API key patterns (starts with AIza and is approx 39 chars)
  return msg.replace(/AIza[0-9A-Za-z-_]{35}/g, '***HIDDEN_KEY***');
};

export const editImageWithGemini = async ({ base64Image, mimeType, prompt, logoBase64, logoMimeType, imageSize, apiKey }: EditImageParams): Promise<string> => {
  try {
    // SECURITY: Prioritize the manually entered apiKey.
    // In Production, it is recommended NOT to rely on process.env.API_KEY to avoid accidental leakage in public builds.
    const finalApiKey = apiKey || process.env.API_KEY;

    if (!finalApiKey) {
      throw new Error("API Key is missing. Please connect or enter your API key first.");
    }

    // CRITICAL: Always create a new instance right before making the call.
    const ai = new GoogleGenAI({ apiKey: finalApiKey });

    // Prepare the parts
    // Clean the base64 string if it contains the header (e.g., "data:image/png;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const parts: any[] = [
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType,
        },
      }
    ];

    // If a logo is provided, add it as the second image part
    if (logoBase64 && logoMimeType) {
      const cleanLogo = logoBase64.split(',')[1] || logoBase64;
      parts.push({
        inlineData: {
          data: cleanLogo,
          mimeType: logoMimeType,
        }
      });
    }

    // Add the text prompt
    // We add a preamble to ensure the model understands the role of the images if a logo is present.
    let finalPrompt = prompt;
    if (logoBase64) {
      finalPrompt = `Image 1 is the Original Design. Image 2 is the New Logo.\n\n${prompt}`;
    }

    parts.push({
      text: finalPrompt,
    });

    let attempts = 0;
    const maxAttempts = 5; // Increased retries for overloaded scenarios

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: {
            parts: parts,
          },
          config: {
            imageConfig: {
              imageSize: imageSize, 
              aspectRatio: "1:1"
            }
          },
        });

        // Iterate through parts to find the image output
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              // Construct the data URL
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
        
        throw new Error("No image data found in the response.");

      } catch (e: any) {
        attempts++;
        
        // Check for retryable errors: 503 (Overloaded/Unavailable) and 500 (Internal)
        const isRetryable = 
            e.code === 503 || 
            e.status === 503 || 
            e.status === 'UNAVAILABLE' || 
            e.message?.includes('overloaded') ||
            e.code === 500 || 
            e.status === 500 || 
            e.status === 'INTERNAL' ||
            e.message?.includes('Internal error');
        
        if (isRetryable && attempts < maxAttempts) {
           // Exponential backoff: 2s, 4s, 8s, 16s...
           const delay = Math.pow(2, attempts) * 1000;
           console.warn(`Gemini API Error (${e.status || e.code}: ${e.message}). Retrying in ${delay}ms... (Attempt ${attempts}/${maxAttempts})`);
           await new Promise(r => setTimeout(r, delay));
           continue;
        }
        throw e;
      }
    }
    
    throw new Error("Failed to generate image after retries.");

  } catch (error: any) {
    // SECURITY: Sanitize error before logging or throwing
    const safeErrorMsg = sanitizeError(error);
    console.error("Gemini Image Gen Error:", safeErrorMsg);
    
    // If the entity was not found or permission denied, it often means the key is invalid for this model
    if (error.message?.includes('Requested entity was not found') || error.status === 403 || error.status === 404) {
       throw new Error("API_KEY_INVALID");
    }
    
    throw new Error(safeErrorMsg);
  }
};