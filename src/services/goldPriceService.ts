/**
 * Gold Price Service
 * Fetches live gold prices from MoneyControl API
 */

interface GoldPriceAPIResponse {
  data?: {
    pricecurrent?: string | number;
    lastPrice?: string | number;
  };
  lastPrice?: string | number;
  pricecurrent?: string | number;
}

interface GoldPriceResult {
  success: boolean;
  basePrice?: number; // Price per gram
  rawPrice?: number; // Raw price for 10g from API
  expiry?: string;
  error?: string;
  timestamp: string;
}

/**
 * Fetches the default expiry date from MoneyControl
 */
async function fetchDefaultExpiry(): Promise<string> {
  try {
    const response = await fetch(
      'https://www.moneycontrol.com/commodity/mcx-gold-price/?type=futures',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch expiry: ${response.status}`);
    }

    const htmlContent = await response.text();

    // Extract expiry date using the specified split pattern
    const splitStart = '"default_expiry":["';
    const splitEnd = '","';

    const startIndex = htmlContent.indexOf(splitStart);
    if (startIndex === -1) {
      throw new Error('Could not find "default_expiry" in response');
    }

    const startPosition = startIndex + splitStart.length;
    const endIndex = htmlContent.indexOf(splitEnd, startPosition);

    if (endIndex === -1) {
      throw new Error('Could not find end pattern after default_expiry');
    }

    const expiry = htmlContent.substring(startPosition, endIndex);
    
    if (!expiry || expiry.length < 8) {
      throw new Error('Invalid expiry date extracted');
    }

    return expiry;
  } catch (error) {
    console.error('Error fetching default expiry:', error);
    throw error;
  }
}

/**
 * Fetches gold price data for a specific expiry date
 */
async function fetchGoldPriceByExpiry(expiry: string): Promise<GoldPriceAPIResponse> {
  try {
    const priceApiUrl = `https://priceapi.moneycontrol.com/pricefeed/mcx/commodityfutures/GOLD?expiry=${expiry}`;
    
    const response = await fetch(priceApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch gold price: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching gold price:', error);
    throw error;
  }
}

/**
 * Extracts the last price from API response
 * Handles multiple possible response formats
 */
function extractlastPrice(apiResponse: GoldPriceAPIResponse): number {
  // Try different possible locations for the price
  console.log("----->>>>>",apiResponse)
  const possiblePrices = [
    apiResponse.data?.pricecurrent,
    apiResponse.data?.lastPrice,
    apiResponse.lastPrice,
    apiResponse.pricecurrent,
  ];

  for (const price of possiblePrices) {
    if (price !== undefined && price !== null) {
      const numPrice = typeof price === 'string' ? parseFloat(price) : price;
      if (!isNaN(numPrice) && numPrice > 0) {
        return numPrice;
      }
    }
  }

  throw new Error('Could not extract valid price from API response');
}

/**
 * Main function to fetch current gold price
 * Returns base price per gram (converted from 10g price)
 */
export async function fetchLiveGoldPrice(): Promise<GoldPriceResult> {
  const timestamp = new Date().toISOString();

  try {
    // Step 1: Fetch default expiry
    const expiry = await fetchDefaultExpiry();
    console.log('Fetched expiry:', expiry);

    // Step 2: Fetch gold price using expiry
    const priceData = await fetchGoldPriceByExpiry(expiry);
    console.log('Fetched price data:', priceData);

    // Step 3: Extract last price (this is for 10g)
    const priceFor10g = extractlastPrice(priceData);
    
    if (priceFor10g <= 0) {
      throw new Error('Invalid price received from API');
    }

    // Step 4: Convert to per gram price
    const basePricePerGram = parseFloat((priceFor10g / 10).toFixed(2));

    console.log('Price calculation:', {
      priceFor10g,
      basePricePerGram,
      expiry,
    });

    return {
      success: true,
      basePrice: basePricePerGram,
      rawPrice: priceFor10g,
      expiry,
      timestamp,
    };
  } catch (error) {
    console.error('Error in fetchLiveGoldPrice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp,
    };
  }
}

/**
 * Calculate final gold price with premium
 * @param basePrice - Base price per gram from API
 * @param premium - Admin-defined premium to add per gram
 * @returns Final price per gram
 */
export function calculateFinalGoldPrice(basePrice: number, premium: number): number {
  if (basePrice <= 0) {
    throw new Error('Base price must be greater than 0');
  }
  
  if (premium < 0) {
    throw new Error('Premium cannot be negative');
  }

  return parseFloat((basePrice + premium).toFixed(2));
}

/**
 * Calculate prices for different carat types
 * @param basePrice24K - Base 24K price per gram (API price + premium)
 * @returns Object with prices for all carat types
 */
export function calculateCaratPrices(basePrice24K: number) {
  const conversionFactors = {
    '24K': 1.0,
    '22K': 0.916, // More accurate than 0.93
    '18K': 0.75,  // More accurate than 0.76
    '14K': 0.585, // More accurate than 0.60
  };

  const prices: Record<string, number> = {};
  
  for (const [carat, factor] of Object.entries(conversionFactors)) {
    prices[carat] = parseFloat((basePrice24K * factor).toFixed(2));
  }

  return prices;
}
