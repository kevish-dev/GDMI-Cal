import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

/**
 * Convert File to base64 string for browser environment
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      // Remove the data URL prefix to get just base64
      const base64String = base64.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text from jewelry tag images using Google Gemini
 * @param {File} topImage - Top view of jewelry tag
 * @param {File} bottomImage - Bottom view of jewelry tag
 * @param {string} jewelryType - Type of jewelry: "gold" or "diamond"
 * @returns {Promise<Object>} Extracted data as JSON
 */
export async function extractTextFromImages(topImage, bottomImage, jewelryType) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert images to base64
    const topImageBase64 = await fileToBase64(topImage);
    const bottomImageBase64 = await fileToBase64(bottomImage);

    // Create jewelry-specific prompt
    const prompt = jewelryType === "gold" 
      ? `Analyze these two images of a gold jewelry tag (top view and bottom view). Extract all visible text and convert it into a JSON object with the following fields:
- weight (in grams, as a number)
- carat (as string, e.g., "22K", "18K", "14K")
- grossWeight (total weight with stones, in grams, as a number)
- netWeight (gold weight without stones, in grams, as a number)
- stoneWeight (weight of stones/kundan if any, in grams, as a number)
- purity (gold purity percentage if mentioned)
- itemCode (product/item code if visible)
- type (type of jewelry like chain, ring, bangle, etc.)

Only include fields that are clearly visible in the images. Use null for fields that cannot be determined. Return ONLY valid JSON, no additional text or markdown.`
      : `Analyze these two images of a diamond jewelry tag (top view and bottom view). Extract all visible text and convert it into a JSON object with the following fields:
- weight (gold weight in grams, as a number)
- carat (gold carat as string, e.g., "22K", "18K", "14K")
- diamondWeight (diamond weight in carats, as a number)
- color (diamond color grade like D, E, F, G, H, I, J, K, L)
- clarity (diamond clarity like IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1, I2, I3)
- stoneWeight (weight of other stones if any, in grams, as a number)
- grossWeight (total weight, in grams, as a number)
- netWeight (gold weight, in grams, as a number)
- itemCode (product/item code if visible)
- certification (if certificate number is visible, include it)

Only include fields that are clearly visible in the images. Use null for fields that cannot be determined. Return ONLY valid JSON, no additional text or markdown.`;

    // Call Gemini API with both images
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: topImageBase64,
          mimeType: topImage.type,
        },
      },
      {
        inlineData: {
          data: bottomImageBase64,
          mimeType: bottomImage.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    // Remove markdown code blocks if present
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    try {
      const jsonData = JSON.parse(cleanedText);
      console.log("✅ Extracted JSON:");
      console.log(JSON.stringify(jsonData, null, 2));
      return jsonData;
    } catch (error) {
      console.warn("⚠️ Model output is not pure JSON, here's the raw text:\n");
      console.log(text);
      throw new Error("Failed to parse extracted data as JSON");
    }
  } catch (error) {
    console.error("Error extracting text from images:", error);
    throw new Error("Failed to extract text from images. Please ensure images are clear and try again.");
  }
}

/**
 * Validate extracted data based on jewelry type
 */
export function validateExtractedData(data, jewelryType) {
  if (jewelryType === "gold") {
    return !!(data.weight || data.netWeight || data.grossWeight);
  } else {
    return !!(data.weight || data.netWeight) && !!data.diamondWeight;
  }
}
