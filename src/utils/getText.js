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
 * Extract text from Jewellery tag images using Google Gemini
 * @param {File} topImage - Top view of Jewellery tag
 * @param {File|null} bottomImage - Bottom view of Jewellery tag (optional)
 * @param {string} JewelleryType - Type of Jewellery: "gold" or "diamond"
 * @returns {Promise<Object>} Extracted data as JSON
 */
export async function extractTextFromImages(topImage, bottomImage, JewelleryType) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert images to base64
    const topImageBase64 = await fileToBase64(topImage);
    const bottomImageBase64 = bottomImage ? await fileToBase64(bottomImage) : null;

    // Create Jewellery-specific prompt
    const imageCount = bottomImageBase64 ? "two images" : "one image";
    const viewText = bottomImageBase64 ? "(top view and bottom view)" : "(top view)";
    
    const prompt = JewelleryType === "gold" 
      ? `You are analyzing ${imageCount} of a gold Jewellery tag ${viewText}. These tags can be in various formats including:
- Green/mint colored tags with QR codes
- Blue/light colored tags with barcode
- Pink/purple tags with printed text
- White tags with printed information

The tags may contain information in different formats and abbreviations:
- Gross Weight: G.W, G.Wt, GW, GRW, G WT, Gross, Gross Wt (total weight in grams)
- Net/Gold Weight: N.W, N.Wt, NW, Net Wt, Gold Wt, Gold Weight, G.Wt (pure gold weight in grams)
- Stone Weight: STN, Stn, STONES, Stone Wt, SW, CS, Colour Stone, Color Stone (in grams for gold jewelry)
- Kundan: KUN, Kun, KN, KUND, KUNDAN (in grams) - SEPARATE from stones
- Diamond Weight (for mixed gold pieces): DW, D.W, Dia Wt, Dia W, D WT, Diamond Wt, RD (Round Diamond) (in carats)
- Piroi/Peroi: Alternative term for stones (in grams)
- ICS: Additional stone information (in grams)
- Item codes may appear as: BG544, GCS029, ER1635, DLR9658, etc.
- Purity: 22K, 18K, 14K, or as "22KT", "18KT"
- Weights may be written with backslash separators (e.g., "1.250\\1000" means 1.250 grams for one type, 1.000 for another)

Extract ALL visible text and convert it into a JSON object with these fields:
{
  "weight": <number in grams - use netWeight (N.W) if available, otherwise grossWeight (G.W)>,
  "grossWeight": <number in grams - total weight including stones>,
  "netWeight": <number in grams - pure gold weight without stones>,
  "carat": <string - e.g., "22K", "18K", "14K">,
  "stoneWeight": <number in grams - total weight of stones (STN/STONES/ICS/CS/Piroi/Peroi), DO NOT include kundan>,
  "kundanWeight": <number in grams - total weight of kundan (KUN/KUND/KUNDAN), separate from stones>,
  "diamondWeight": <number in carats - ONLY if mixed gold-diamond piece with DW/RD notation>,
  "stones": [
    {
      "type": <string - stone type: "STN", "STONES", "CS", "F STONES", "ICS", "Piroi", "Peroi" - NEVER include KUN/KUNDAN here>,
      "weight": <number in grams>,
      "count": <number - piece count if mentioned>,
      "unit": "g"
    }
  ],
  "itemCode": <string - product code like "BG544", "GCS029", "DLR9658", "OLRB874", "PR-LR-9127">,
  "type": <string - if visible: chain, ring, bangle, earring, pendant, etc.>,
  "purity": <string - gold purity if mentioned>,
  "diameter": <string - if mentioned like "Dia.2.50">,
  "huid": <string - HUID number if visible>,
  "hallmark": <string - hallmark information if visible>,
  "rawText": <string - any other visible text not captured above>
}

CRITICAL parsing rules:
1. When you see formats like "1.250\\1000", extract both values and sum them
2. For stone notations like "PC-104\\2.01", PC-104 is piece count, 2.01 is weight
3. For "STN:1.250\\1000", stones total = 1.250 + 1.000 = 2.250 grams
4. KUNDAN (KUN/KUND/KUNDAN) must be added DIRECTLY to "kundanWeight" field - DO NOT add to stones array
5. STONES (STN/CS/Piroi/Peroi/F STONES/ICS) must be added to "stones" array and summed in "stoneWeight" field
6. All stone weights in gold jewelry are in GRAMS (unit: "g")
7. Diamond weights (DW/RD) in mixed pieces are in CARATS (unit: "ct")
8. Kundan weights are ALWAYS in GRAMS (unit: "g")
9. Item codes can have various formats - capture exact text
10. QR codes and barcodes are for reference - focus on printed text
11. Extract HUID and hallmark information if visible
12. Calculate stoneWeight by summing all stone entries from stones array
13. Calculate kundanWeight by summing all kundan mentions (KUN/KUND/KUNDAN) - put total in kundanWeight field directly

Only include fields with actual values. Use null for fields that cannot be determined. Return ONLY valid JSON, no additional text or markdown.`
      : `You are analyzing ${imageCount} of a diamond Jewellery tag ${viewText}. These tags can be in various formats including:
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
- Colors: D, E, F, G, H, I, J, K, L (may appear as pairs: GH, IJ, JK, KL)
- Clarity: IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1, I2, I3 (may appear as ranges: VVS, VS, SI, VSSI)
- Color-Clarity notations: "JK-SI2" (color: JK, clarity: SI2), "GH/VS1" (color: GH, clarity: VS1)
- IGI certification: Look for "IGI" text or certificate numbers

Extract ALL visible text and convert it into a JSON object with these fields:
{
  "weight": <number in grams - gold weight (N.W if available)>,
  "grossWeight": <number in grams - total weight>,
  "netWeight": <number in grams - pure gold weight>,
  "carat": <string - gold purity like "22K", "18K", "14K">,
  "diamondWeight": <number in carats - total diamond weight>,
  "color": <string - extract from patterns like "JK-SI2" → "JK", "GH/VS1" → "GH", or standalone "GH", "IJ", etc.>,
  "clarity": <string - extract from patterns like "JK-SI2" → "SI2", "GH/VS1" → "VS1", or standalone "VS", "SI", "VVS">,
  "igiCertified": <boolean - true if "IGI" text found on tag>,
  "diamonds": [
    {
      "type": <string - e.g., "RD" (round), "PC" (pear cut), "ELITE">,
      "weight": <number in carats>,
      "count": <number - piece count if mentioned like "PC-249">,
      "color": <string - extract from notations near this diamond, e.g., "GH", "IJ", "JK">,
      "clarity": <string - extract from notations near this diamond, e.g., "VS1", "SI2", "VVS">
    }
  ],
  "stoneWeight": <number in carats - total weight of other stones (CS, AMETHYST, etc.) - NOT kundan, NOT diamonds>,
  "kundanWeight": <number in grams - total weight of kundan (KUN/KUND/KUNDAN)>,
  "stones": [
    {
      "type": <string - stone type: "CS", "AMETHYST", "COLOR STONE" - NEVER include diamonds or kundan here>,
      "weight": <number in carats - for diamond jewelry, stone weights are in carats>,
      "count": <number>,
      "unit": "ct"
    }
  ],
  "itemCode": <string - product code like "BG544", "DLR9658", "OLRB874", "PR-LR-8644">,
  "diameter": <string - if mentioned like "Dia.1.62">,
  "certification": <string - certificate number if visible>,
  "type": <string - if visible: ring, pendant, earring, etc.>,
  "rawText": <string - any other visible text not captured above>
}

CRITICAL parsing rules:
1. When you see formats like "PC-249\\1.36", PC-249 means 249 pieces, 1.36 is weight in carats
2. For "RD:- PC-104\\2.01", RD is Round Diamond, 104 pieces, 2.01 carats total
3. DIAMONDS: Create diamonds array for each diamond type (RD, PC, ELITE, etc.) with type, weight, count, color, clarity
4. OTHER STONES (NOT diamonds, NOT kundan): Add to stones array (CS, AMETHYST, etc.) with weight in carats and sum in stoneWeight field
5. KUNDAN (KUN/KUND/KUNDAN): Add DIRECTLY to "kundanWeight" field in GRAMS - DO NOT add to stones array
6. Multiple stone types should be listed separately in their arrays
7. Item codes can have various formats - capture exact text
8. Diamond weights are ALWAYS in carats (ct)
9. For diamond jewelry, other stone weights (CS, AMETHYST) are in CARATS (ct)
10. Kundan weights are ALWAYS in GRAMS (g)
11. Color-Clarity patterns: "JK-SI2" → color: "JK", clarity: "SI2"
12. Color-Clarity patterns: "GH/VS1" → color: "GH", clarity: "VS1"
13. Compact clarity: "VSSI" → "VS-SI", "VVS" → "VVS"
14. Look for "IGI" text to set igiCertified flag
15. QR codes and barcodes are for reference - focus on printed text
16. Calculate diamondWeight by summing all weights from diamonds array
17. Calculate stoneWeight by summing all weights from stones array (excluding diamonds and kundan)

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
 * Validate extracted data based on Jewellery type
 */
export function validateExtractedData(data, JewelleryType) {
  if (JewelleryType === "gold") {
    return !!(data.weight || data.netWeight || data.grossWeight);
  } else {
    return !!(data.weight || data.netWeight) && !!data.diamondWeight;
  }
}

/**
 * Normalize extracted data to ensure consistent format
 * Handles various tag formats and calculates derived values
 */
export function normalizeExtractedData(data, JewelleryType) {
  const normalized = { ...data };
  
  console.log("🔍 Normalizing extracted data for:", JewelleryType);
  console.log("📥 Input data:", JSON.stringify(data, null, 2));

  if (JewelleryType === "gold") {
    // Kundan weight is extracted directly from the AI - just ensure unit is set
    if (normalized.kundanWeight && normalized.kundanWeight > 0) {
      normalized.kundanWeightUnit = 'g'; // Kundan is always in grams
      console.log(`👑 Kundan Weight: ${normalized.kundanWeight}g`);
    }

    // Stone weight should come directly from AI, or calculate from stones array as fallback
    if (!normalized.stoneWeight && normalized.stones && Array.isArray(normalized.stones)) {
      normalized.stoneWeight = normalized.stones.reduce((sum, stone) => {
        return sum + (stone.weight || 0);
      }, 0);
      console.log(`💎 Calculated Stone Weight from array: ${normalized.stoneWeight}g`);
    }
    
    // For gold jewelry, stone weights are in GRAMS
    if (normalized.stoneWeight && normalized.stoneWeight > 0) {
      normalized.stoneWeightUnit = 'g';
      console.log(`💎 Stone Weight: ${normalized.stoneWeight}g`);
    }

    // Ensure we have a weight field (prefer netWeight, then grossWeight)
    if (!normalized.weight) {
      normalized.weight = normalized.netWeight || normalized.grossWeight || 0;
    }

    // Calculate netWeight if we have grossWeight and stoneWeight
    // Note: grossWeight typically includes both stones and kundan
    const totalStoneAndKundan = (normalized.stoneWeight || 0) + (normalized.kundanWeight || 0);
    if (!normalized.netWeight && normalized.grossWeight && totalStoneAndKundan > 0) {
      normalized.netWeight = normalized.grossWeight - totalStoneAndKundan;
    }

    // Calculate grossWeight if we have netWeight and stoneWeight
    if (!normalized.grossWeight && normalized.netWeight && totalStoneAndKundan > 0) {
      normalized.grossWeight = normalized.netWeight + totalStoneAndKundan;
    }

  } else if (JewelleryType === "diamond") {
    // Calculate total diamond weight from diamonds array - ALWAYS recalculate if array exists
    if (normalized.diamonds && Array.isArray(normalized.diamonds) && normalized.diamonds.length > 0) {
      console.log("💎 Processing diamonds array:", normalized.diamonds);
      const calculatedDiamondWeight = normalized.diamonds.reduce((sum, diamond) => {
        const weight = diamond.weight || 0;
        console.log(`  ✅ Found Diamond: ${weight}ct (${diamond.type || 'unknown'})`);
        return sum + weight;
      }, 0);
      
      if (calculatedDiamondWeight > 0) {
        normalized.diamondWeight = calculatedDiamondWeight;
        normalized.diamondWeightUnit = 'ct';
        console.log(`💎 Total Diamond Weight: ${calculatedDiamondWeight}ct`);
      }
    } else if (normalized.diamondWeight) {
      console.log(`💎 Diamond Weight (direct): ${normalized.diamondWeight}ct`);
    } else {
      console.log("⚠️ No diamonds array or diamondWeight found in extracted data");
    }

    // Kundan weight is extracted directly from the AI - just ensure unit is set
    if (normalized.kundanWeight && normalized.kundanWeight > 0) {
      normalized.kundanWeightUnit = 'g'; // Kundan is always in grams
      console.log(`👑 Kundan Weight: ${normalized.kundanWeight}g`);
    }

    // Stone weight should come directly from AI, or calculate from stones array as fallback
    if (!normalized.stoneWeight && normalized.stones && Array.isArray(normalized.stones)) {
      normalized.stoneWeight = normalized.stones.reduce((sum, stone) => {
        return sum + (stone.weight || 0);
      }, 0);
      console.log(`💎 Calculated Stone Weight from array: ${normalized.stoneWeight}ct`);
    }
    
    // For diamond jewelry, stone weights are in CARATS
    if (normalized.stoneWeight && normalized.stoneWeight > 0) {
      normalized.stoneWeightUnit = 'ct';
      console.log(`💎 Stone Weight: ${normalized.stoneWeight}ct`);
    }

    // Ensure we have a weight field for gold weight
    if (!normalized.weight) {
      normalized.weight = normalized.netWeight || 0;
    }
    
    // Calculate netWeight from grossWeight if needed
    // For diamond jewelry: Gross Weight - (Diamond Weight in grams + Stone Weight in grams)
    if (!normalized.netWeight && normalized.grossWeight) {
      let totalDeduction = 0;
      
      // Convert diamond weight from carats to grams (1 carat = 0.2 grams)
      if (normalized.diamondWeight && normalized.diamondWeight > 0) {
        const diamondWeightInGrams = normalized.diamondWeight * 0.2;
        totalDeduction += diamondWeightInGrams;
        console.log(`💎 Diamond deduction: ${normalized.diamondWeight}ct = ${diamondWeightInGrams.toFixed(4)}g`);
      }
      
      // Convert stone weight from carats to grams (1 carat = 0.2 grams)
      if (normalized.stoneWeight && normalized.stoneWeight > 0) {
        const stoneWeightInGrams = normalized.stoneWeight * 0.2;
        totalDeduction += stoneWeightInGrams;
        console.log(`💎 Stone deduction: ${normalized.stoneWeight}ct = ${stoneWeightInGrams.toFixed(4)}g`);
      }
      
      // Calculate net weight
      if (totalDeduction > 0) {
        normalized.netWeight = normalized.grossWeight - totalDeduction;
        normalized.weight = normalized.netWeight;
        console.log(`⚖️ Net Weight Calculation: ${normalized.grossWeight}g - ${totalDeduction.toFixed(4)}g = ${normalized.netWeight.toFixed(4)}g`);
      }
    }
    
    // Extract color and clarity from diamonds array if available
    if (normalized.diamonds && Array.isArray(normalized.diamonds) && normalized.diamonds.length > 0) {
      // Use the first diamond's color and clarity as defaults if not set
      if (!normalized.color && normalized.diamonds[0].color) {
        normalized.color = normalized.diamonds[0].color;
      }
      if (!normalized.clarity && normalized.diamonds[0].clarity) {
        normalized.clarity = normalized.diamonds[0].clarity;
      }
    }
  }

  // Normalize carat format (remove variations)
  if (normalized.carat) {
    normalized.carat = normalized.carat.toUpperCase().replace(/KT$/, 'K');
  }

  console.log("📤 Normalized output data:");
  console.log(`  - Gold Weight: ${normalized.weight || normalized.netWeight || 0}g`);
  console.log(`  - Stone Weight: ${normalized.stoneWeight || 0}${normalized.stoneWeightUnit || 'g'}`);
  console.log(`  - Kundan Weight: ${normalized.kundanWeight || 0}${normalized.kundanWeightUnit || 'g'}`);
  console.log(`  - Diamond Weight: ${normalized.diamondWeight || 0}ct`);
  console.log(`  - Carat: ${normalized.carat || 'N/A'}`);

  return normalized;
}
