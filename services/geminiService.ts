
import { GoogleGenAI } from "@google/genai";
import { ProductAttribute, LayoutMode } from "../types";

// Models Configuration
const MODEL_PRO = 'gemini-3-pro-image-preview';

interface BatchEditorParams {
  originalImageBase64: string;
  mimeType: string;
  prompt: string;
  logoBase64?: string | null;
  logoMimeType?: string;
  imageSize: string;
  apiKey?: string | null;
}

interface LayoutGenParams {
  mode: LayoutMode;
  productImageBase64: string; // The product (or the blueprint itself in blueprint mode)
  productMimeType: string;
  
  // Reference Image OR Blueprint Image
  referenceLayoutBase64: string; 
  referenceLayoutMimeType: string;
  
  prompt: string;
  logoBase64?: string | null; 
  logoMimeType?: string;
  
  // Specific Product Data
  titleText: string;
  attributes: ProductAttribute[];
  userInstructions?: string; // Specific instructions for blueprint mode
  
  imageSize: string;
  apiKey?: string | null;
}

const sanitizeError = (error: any): string => {
  const msg = error?.message || String(error);
  return msg.replace(/AIza[0-9A-Za-z-_]{35}/g, '***HIDDEN_KEY***');
};

const executeGeminiRequest = async (parts: any[], imageSize: string, apiKey: string | undefined | null) => {
  try {
    const finalApiKey = apiKey || process.env.API_KEY;
    if (!finalApiKey) {
      throw new Error("API Key is missing. Please connect or enter your API key first.");
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: MODEL_PRO,
          contents: { parts: parts },
          config: {
            imageConfig: {
              imageSize: imageSize,
              aspectRatio: "1:1"
            }
          },
        });

        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
        throw new Error("No image data found in the response.");

      } catch (e: any) {
        attempts++;
        const errorString = JSON.stringify(e);
        const message = e.message || '';
        
        const isOverloaded = 
            message.includes('overloaded') || message.includes('503') || message.includes('UNAVAILABLE') ||
            errorString.includes('overloaded') || errorString.includes('UNAVAILABLE') ||
            e.status === 503 || e.code === 503;
            
        const isInternal = 
            message.includes('Internal error') || message.includes('500') || message.includes('INTERNAL') ||
            e.status === 500 || e.code === 500;
        
        if ((isOverloaded || isInternal) && attempts < maxAttempts) {
           const baseDelay = 2000;
           const delay = (baseDelay * Math.pow(1.5, attempts)) + (Math.random() * 1000);
           console.warn(`Gemini API Busy (${attempts}/${maxAttempts}). Waiting ${Math.round(delay)}ms...`);
           await new Promise(r => setTimeout(r, delay));
           continue;
        }
        throw e;
      }
    }
    throw new Error("Failed to generate image after multiple attempts.");

  } catch (error: any) {
    const safeErrorMsg = sanitizeError(error);
    console.error("Gemini Gen Error:", safeErrorMsg);
    if (error.message?.includes('Requested entity was not found') || error.status === 403 || error.status === 404) {
       throw new Error("API_KEY_INVALID");
    }
    throw new Error(safeErrorMsg);
  }
};

// --- 1. BATCH EDITOR SERVICE ---
export const runBatchEditor = async (params: BatchEditorParams): Promise<string> => {
  const parts: any[] = [];

  // Part 1: Original Image
  const cleanBase64 = params.originalImageBase64.split(',')[1] || params.originalImageBase64;
  parts.push({
      inlineData: { data: cleanBase64, mimeType: params.mimeType }
  });

  // Part 2: Logo (Optional)
  if (params.logoBase64 && params.logoMimeType) {
      const cleanLogo = params.logoBase64.split(',')[1] || params.logoBase64;
      parts.push({
          inlineData: { data: cleanLogo, mimeType: params.logoMimeType }
      });
  }

  // Part 3: Prompt
  parts.push({ text: params.prompt });

  return executeGeminiRequest(parts, params.imageSize, params.apiKey);
};

// --- 2. LAYOUT GENERATOR SERVICE (UPDATED) ---
export const runLayoutGenerator = async (params: LayoutGenParams): Promise<string> => {
  const parts: any[] = [];
  let partIndex = 1;

  if (params.mode === 'blueprint') {
      // --- BLUEPRINT MODE ---
      // 1. The Blueprint (Sketch)
      const cleanBlueprint = params.referenceLayoutBase64.split(',')[1] || params.referenceLayoutBase64;
      parts.push({
          inlineData: { data: cleanBlueprint, mimeType: params.referenceLayoutMimeType }
      });
      const blueprintIndex = partIndex++;

      // 2. Logo (Optional)
      let logoIndex = -1;
      if (params.logoBase64 && params.logoMimeType) {
          const cleanLogo = params.logoBase64.split(',')[1] || params.logoBase64;
          parts.push({
              inlineData: { data: cleanLogo, mimeType: params.logoMimeType }
          });
          logoIndex = partIndex++;
      }

      // Prompt Construction
      let finalPrompt = params.prompt;
      
      finalPrompt += `\n\nIMAGE MAPPING:\n`;
      finalPrompt += `- IMAGE ${blueprintIndex} is the BLUEPRINT/SKETCH/WIREFRAME. You must analyze this image to find the Header, Product Position, and Text Position.\n`;
      if (logoIndex > -1) {
          finalPrompt += `- IMAGE ${logoIndex} is the LOGO. Insert this logo into the Header area found in IMAGE ${blueprintIndex}.\n`;
      }
      
      finalPrompt += `\nNOTE: You MUST DETECT text placeholders in the Blueprint and render them realistically as described in the System Instruction.`;
      
      if (params.userInstructions) {
          finalPrompt += `\n\nUSER SPECIFIC CONTEXT / INSTRUCTIONS:\n${params.userInstructions}\n(Prioritize these details for product appearance, colors, or specific text contents).`;
      }

      parts.push({ text: finalPrompt });

  } else if (params.mode === 'auto_design') {
      // --- AUTO DESIGN MODE (No Reference Image) ---
      
      // 1. Product Image
      const cleanProduct = params.productImageBase64.split(',')[1] || params.productImageBase64;
      parts.push({
          inlineData: { data: cleanProduct, mimeType: params.productMimeType }
      });
      const productIndex = partIndex++;

      // 2. Logo (Optional but Recommended)
      let logoIndex = -1;
      if (params.logoBase64 && params.logoMimeType) {
          const cleanLogo = params.logoBase64.split(',')[1] || params.logoBase64;
          parts.push({
              inlineData: { data: cleanLogo, mimeType: params.logoMimeType }
          });
          logoIndex = partIndex++;
      }

      // 3. Attribute Icons
      let attributeInstructions = "CONTENT TO BE DESIGNED:\n";
      
      if (params.attributes && params.attributes.length > 0) {
        for (const attr of params.attributes) {
            if (attr.iconBase64 && attr.iconMime) {
                 const cleanIcon = attr.iconBase64.split(',')[1] || attr.iconBase64;
                 parts.push({
                     inlineData: { data: cleanIcon, mimeType: attr.iconMime }
                 });
                 const iconIndex = partIndex++;
                 attributeInstructions += `- Attribute: "${attr.text}". Use IMAGE ${iconIndex} as the icon.\n`;
            } else {
                 attributeInstructions += `- Attribute: "${attr.text}". (No icon provided, generate one or just use text).\n`;
            }
        }
      } else {
          attributeInstructions += "(No specific attributes provided)\n";
      }

      // Construct Prompt
      let finalPrompt = params.prompt;
      finalPrompt += `\n\n=== IMAGE MAPPING ===\n`;
      finalPrompt += `IMAGE ${productIndex} is the MAIN PRODUCT.\n`;
      if (logoIndex > -1) {
          finalPrompt += `IMAGE ${logoIndex} is the LOGO (Must be in Header).\n`;
      }

      finalPrompt += `\n${attributeInstructions}\n`;
      finalPrompt += `PRODUCT TITLE: "${params.titleText}"\n`;

      parts.push({ text: finalPrompt });

  } else {
      // --- REFERENCE LAYOUT MODE ---
      
      // 1. Reference Layout
      const cleanRef = params.referenceLayoutBase64.split(',')[1] || params.referenceLayoutBase64;
      parts.push({
          inlineData: { data: cleanRef, mimeType: params.referenceLayoutMimeType }
      });
      const refIndex = partIndex++;

      // 2. Logo
      let logoIndex = -1;
      if (params.logoBase64 && params.logoMimeType) {
          const cleanLogo = params.logoBase64.split(',')[1] || params.logoBase64;
          parts.push({
              inlineData: { data: cleanLogo, mimeType: params.logoMimeType }
          });
          logoIndex = partIndex++;
      }

      // 3. Product Image
      const cleanProduct = params.productImageBase64.split(',')[1] || params.productImageBase64;
      parts.push({
          inlineData: { data: cleanProduct, mimeType: params.productMimeType }
      });
      const productIndex = partIndex++;

      // 4. Attribute Icons
      let attributeInstructions = "NEW ATTRIBUTES LIST & ICONS:\n";
      
      if (params.attributes && params.attributes.length > 0) {
        for (const attr of params.attributes) {
            if (attr.iconBase64 && attr.iconMime) {
                 const cleanIcon = attr.iconBase64.split(',')[1] || attr.iconBase64;
                 parts.push({
                     inlineData: { data: cleanIcon, mimeType: attr.iconMime }
                 });
                 const iconIndex = partIndex++;
                 attributeInstructions += `- Text: "${attr.text}". Use IMAGE ${iconIndex} as the icon for this text.\n`;
            } else {
                 attributeInstructions += `- Text: "${attr.text}". NO ICON PROVIDED. Please GENERATE a suitable minimalist outline icon for this attribute.\n`;
            }
        }
      } else {
          attributeInstructions += "(No specific attributes provided)\n";
      }

      let finalPrompt = params.prompt;
      finalPrompt += `\n\n=== DATA MAPPING INSTRUCTIONS ===\n`;
      finalPrompt += `IMAGE ${refIndex} is the REFERENCE LAYOUT TEMPLATE (Must replicate structure 100%).\n`;

      if (logoIndex > -1) {
          finalPrompt += `IMAGE ${logoIndex} is the NEW LOGO (Replace logo in design).\n`;
      }
      finalPrompt += `IMAGE ${productIndex} is the NEW PRODUCT IMAGE (Replace product in design).\n`;
      
      finalPrompt += `\nNEW TEXT CONTENT:\n`;
      finalPrompt += `NEW TITLE: "${params.titleText}"\n`;
      finalPrompt += attributeInstructions;

      parts.push({ text: finalPrompt });
  }

  return executeGeminiRequest(parts, params.imageSize, params.apiKey);
};
