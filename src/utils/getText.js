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
 * @param {File|null} bottomImage - Bottom view of jewelry tag (optional)
 * @param {string} jewelryType - Type of jewelry: "gold" or "diamond"
 * @returns {Promise<Object>} Extracted data as JSON
 */
export async function extractTextFromImages(topImage, bottomImage, jewelryType) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert images to base64
    const topImageBase64 = await fileToBase64(topImage);
    const bottomImageBase64 = bottomImage ? await fileToBase64(bottomImage) : null;

    // Create jewelry-specific prompt
    const imageCount = bottomImageBase64 ? "two images" : "one image";
    const viewText = bottomImageBase64 ? "(top view and bottom view)" : "(top view)";
    
    const prompt = jewelryType === "gold" 
      ? `You are analyzing ${imageCount} of a gold jewelry tag ${viewText}. These tags can be in various formats including:
- Green/mint colored tags with QR codes
- Blue/light colored tags with barcode
- Pink/purple tags with printed text
- White tags with printed information

The tags may contain information in different formats and abbreviations:
- G.W/G.Wt/GW = Gross Weight (total weight in grams)
- N.W/N.Wt/NW = Net Weight (pure gold weight in grams)
- STN/Stn/STONES = Stone weight (in grams or carats)
- KUN/Kun/KUND = Kundan/stone weight (in grams or carats)
- ICS = Additional stone information
- Item codes may appear as: BG544, GCS029, ER1635, DLR9658, etc.
- Purity: 22K, 18K, 14K, or as "22KT", "18KT"
- Weights may be written with backslash separators (e.g., "1.250\\1000" means 1.250 grams for one type, 1.000 for another)

Extract ALL visible text and convert it into a JSON object with these fields:
{
  "weight": <number in grams - use netWeight (N.W) if available, otherwise grossWeight (G.W)>,
  "grossWeight": <number in grams - total weight including stones>,
  "netWeight": <number in grams - pure gold weight without stones>,
  "carat": <string - e.g., "22K", "18K", "14K">,
  "stoneWeight": <number - total weight of all stones/kundan in grams>,
  "stones": [
    {
      "type": <string - e.g., "STN", "STONES", "ICS", "PC", "CS", "RD", "ELITE">,
      "weight": <number in grams or carats>,
      "count": <number - piece count if mentioned like "PC-104">
    }
  ],
  "itemCode": <string - product code like "BG544", "GCS029", "DLR9658", "OLRB874", "PR-LR-9127">,
  "type": <string - if visible: chain, ring, bangle, earring, pendant, etc.>,
  "purity": <string - gold purity if mentioned>,
  "diameter": <string - if mentioned like "Dia.2.50">,
  "rawText": <string - any other visible text not captured above>
}

IMPORTANT parsing rules:
1. When you see formats like "1.250\\1000", extract both values and sum them
2. For stone notations like "PC-104\\2.01", the first is piece count (PC-104) and second is weight (2.01)
3. For "STN:1.250\\1000", this means stones total 1.250+1.000 = 2.250 grams
4. Item codes can have various formats - capture the exact text
5. QR codes and barcodes are for reference only - focus on printed text
6. If multiple stone types (STN, KUN, ICS), list each separately in stones array

Only include fields with actual values. Use null for fields that cannot be determined. Return ONLY valid JSON, no additional text or markdown.`
      : `You are analyzing ${imageCount} of a diamond jewelry tag ${viewText}. These tags can be in various formats including:
- Green/mint colored tags with QR codes
- Pink/purple tags with printed text
- White tags with printed information
- Tags with barcodes

The tags may contain information in different formats and abbreviations:
- G.W/G.Wt/GW = Gross Weight (total weight in grams)
- N.W/N.Wt/NW = Net Weight (gold weight in grams)
- RD/Rd = Round Diamond
- PC/CS = Pear Cut / Color Stone
- DIA/Dia = Diamond
- ELITE/ELITET = Elite grade diamonds
- AMETHYST = Amethyst stones
- Item codes may appear as: BG544, DLR9658, PR-LR-9127, etc.
- Purity: 22K, 18K, 14K, or as "14K", "18KT"
- Diamond weights in carats
- Colors: D, E, F, G, H, I, J, K, L
- Clarity: IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1, I2, I3

Extract ALL visible text and convert it into a JSON object with these fields:
{
  "weight": <number in grams - gold weight (N.W if available)>,
  "grossWeight": <number in grams - total weight>,
  "netWeight": <number in grams - pure gold weight>,
  "carat": <string - gold purity like "22K", "18K", "14K">,
  "diamondWeight": <number in carats - total diamond weight>,
  "diamonds": [
    {
      "type": <string - e.g., "RD" (round), "PC" (pear cut), "ELITE">,
      "weight": <number in carats>,
      "count": <number - piece count if mentioned like "PC-249">,
      "color": <string - D, E, F, G, H, I, J, K, L if mentioned>,
      "clarity": <string - IF, VVS, VS, SI, I if mentioned>
    }
  ],
  "otherStones": [
    {
      "type": <string - e.g., "CS" (color stone), "AMETHYST">,
      "weight": <number>,
      "count": <number>
    }
  ],
  "itemCode": <string - product code like "BG544", "DLR9658", "OLRB874", "PR-LR-8644">,
  "diameter": <string - if mentioned like "Dia.1.62">,
  "certification": <string - certificate number if visible>,
  "type": <string - if visible: ring, pendant, earring, etc.>,
  "rawText": <string - any other visible text not captured above>
}

IMPORTANT parsing rules:
1. When you see formats like "PC-249\\1.36", PC-249 means 249 pieces, 1.36 is weight in carats
2. For "RD:- PC-104\\2.01", RD is Round Diamond, 104 pieces, 2.01 carats total
3. Multiple stone types should be listed separately
4. Item codes can have various formats - capture exact text
5. Diamond weights are typically in carats
6. QR codes and barcodes are for reference - focus on printed text

Only include fields with actual values. Use null for fields that cannot be determined. Return ONLY valid JSON, no additional text or markdown.`;

    // Prepare content array for API call
    const contentParts = [
      { text: prompt },
      {
        inlineData: {
          data: topImageBase64,
          mimeType: topImage.type,
        },
      },
    ];

    // Add bottom image only if it exists
    if (bottomImageBase64) {
      contentParts.push({
        inlineData: {
          data: bottomImageBase64,
          mimeType: bottomImage.type,
        },
      });
    }

    // Call Gemini API with images
    const result = await model.generateContent(contentParts);

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

/**
 * Normalize extracted data to ensure consistent format
 * Handles various tag formats and calculates derived values
 */
export function normalizeExtractedData(data, jewelryType) {
  const normalized = { ...data };

  if (jewelryType === "gold") {
    // Calculate total stone weight from stones array if not provided
    if (!normalized.stoneWeight && normalized.stones && Array.isArray(normalized.stones)) {
      normalized.stoneWeight = normalized.stones.reduce((sum, stone) => {
        return sum + (stone.weight || 0);
      }, 0);
    }

    // Ensure we have a weight field (prefer netWeight, then grossWeight)
    if (!normalized.weight) {
      normalized.weight = normalized.netWeight || normalized.grossWeight || 0;
    }

    // Calculate netWeight if we have grossWeight and stoneWeight
    if (!normalized.netWeight && normalized.grossWeight && normalized.stoneWeight) {
      normalized.netWeight = normalized.grossWeight - normalized.stoneWeight;
    }

    // Calculate grossWeight if we have netWeight and stoneWeight
    if (!normalized.grossWeight && normalized.netWeight && normalized.stoneWeight) {
      normalized.grossWeight = normalized.netWeight + normalized.stoneWeight;
    }

  } else if (jewelryType === "diamond") {
    // Calculate total diamond weight from diamonds array if not provided
    if (!normalized.diamondWeight && normalized.diamonds && Array.isArray(normalized.diamonds)) {
      normalized.diamondWeight = normalized.diamonds.reduce((sum, diamond) => {
        return sum + (diamond.weight || 0);
      }, 0);
    }

    // Calculate other stones weight if provided
    if (normalized.otherStones && Array.isArray(normalized.otherStones)) {
      const otherStonesWeight = normalized.otherStones.reduce((sum, stone) => {
        return sum + (stone.weight || 0);
      }, 0);
      normalized.otherStonesWeight = otherStonesWeight;
    }

    // Ensure we have a weight field for gold weight
    if (!normalized.weight) {
      normalized.weight = normalized.netWeight || 0;
    }
  }

  // Normalize carat format (remove variations)
  if (normalized.carat) {
    normalized.carat = normalized.carat.toUpperCase().replace(/KT$/, 'K');
  }

  return normalized;
}
