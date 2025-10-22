/**
 * Test file for MoneyControl API
 * This test fetches gold futures data from MoneyControl
 */

async function testMoneyControlAPI() {
  try {
    console.log('Step 1: Fetching default expiry from MoneyControl...');
    
    // First API call to get the default expiry date
    const firstResponse = await fetch(
      'https://www.moneycontrol.com/commodity/mcx-gold-price/?type=futures'
    );
    
    if (!firstResponse.ok) {
      throw new Error(`First API call failed: ${firstResponse.status}`);
    }
    
    const htmlContent = await firstResponse.text();
    console.log('Received HTML content, length:', htmlContent.length);
    
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
    console.log('Extracted expiry date:', expiry);
    
    // Second API call using the extracted expiry
    console.log('\nStep 2: Fetching price data with expiry date...');
    const priceApiUrl = `https://priceapi.moneycontrol.com/pricefeed/mcx/commodityfutures/GOLD?expiry=${expiry}`;
    console.log('URL:', priceApiUrl);
    
    const secondResponse = await fetch(priceApiUrl);
    
    if (!secondResponse.ok) {
      throw new Error(`Second API call failed: ${secondResponse.status}`);
    }
    
    const priceData = await secondResponse.json();
    console.log('\nPrice Data:', JSON.stringify(priceData, null, 2));
    
    return {
      success: true,
      expiry,
      priceData
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
console.log('=== MoneyControl API Test ===\n');
testMoneyControlAPI().then(result => {
  console.log('\n=== Test Complete ===');
  console.log('Success:', result.success);
  if (!result.success) {
    console.error('Error:', result.error);
  }
});

export { testMoneyControlAPI };
