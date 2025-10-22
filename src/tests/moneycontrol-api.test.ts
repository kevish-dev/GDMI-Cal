/**
 * Comprehensive Test file for MoneyControl API and Gold Price Service
 * Tests both the raw API calls and the service functions
 */

import { 
  fetchLiveGoldPrice, 
  calculateFinalGoldPrice, 
  calculateCaratPrices 
} from '../services/goldPriceService';

async function testRawAPICall() {
  console.log('=== Test 1: Raw API Call ===\n');
  
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
    console.log('✓ Received HTML content, length:', htmlContent.length);
    
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
    console.log('✓ Extracted expiry date:', expiry);
    
    // Second API call using the extracted expiry
    console.log('\nStep 2: Fetching price data with expiry date...');
    const priceApiUrl = `https://priceapi.moneycontrol.com/pricefeed/mcx/commodityfutures/GOLD?expiry=${expiry}`;
    console.log('URL:', priceApiUrl);
    
    const secondResponse = await fetch(priceApiUrl);
    
    if (!secondResponse.ok) {
      throw new Error(`Second API call failed: ${secondResponse.status}`);
    }
    
    const priceData = await secondResponse.json();
    console.log('✓ Price Data:', JSON.stringify(priceData, null, 2));
    
    return {
      success: true,
      expiry,
      priceData
    };
    
  } catch (error) {
    console.error('✗ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testGoldPriceService() {
  console.log('\n=== Test 2: Gold Price Service ===\n');
  
  try {
    // Test fetching live price
    console.log('Fetching live gold price...');
    const result = await fetchLiveGoldPrice();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch price');
    }
    
    console.log('✓ Successfully fetched live price:');
    console.log('  Raw price (10g):', result.rawPrice?.toLocaleString());
    console.log('  Base price (per gram):', result.basePrice?.toLocaleString());
    console.log('  Expiry:', result.expiry);
    console.log('  Timestamp:', result.timestamp);
    
    return result;
  } catch (error) {
    console.error('✗ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testPriceCalculations() {
  console.log('\n=== Test 3: Price Calculations ===\n');
  
  try {
    // Mock base price for testing
    const mockBasePrice = 7250; // Example base price per gram
    const mockPremium = 2000; // Example premium
    
    console.log('Testing with:');
    console.log('  Base price:', mockBasePrice, '/gram');
    console.log('  Premium:', mockPremium, '/gram\n');
    
    // Test final price calculation
    console.log('1. Testing final price calculation...');
    const finalPrice = calculateFinalGoldPrice(mockBasePrice, mockPremium);
    console.log('✓ Final 24K price:', finalPrice, '/gram');
    console.log('  (Base', mockBasePrice, '+ Premium', mockPremium, '=', finalPrice, ')\n');
    
    // Test carat prices calculation
    console.log('2. Testing carat prices calculation...');
    const caratPrices = calculateCaratPrices(finalPrice);
    console.log('✓ Carat prices:');
    Object.entries(caratPrices).forEach(([carat, price]) => {
      console.log(`  ${carat}: ₹${price.toLocaleString()}/gram`);
    });
    
    return {
      success: true,
      finalPrice,
      caratPrices
    };
  } catch (error) {
    console.error('✗ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testEdgeCases() {
  console.log('\n=== Test 4: Edge Cases ===\n');
  
  const tests = [
    {
      name: 'Negative premium',
      fn: () => calculateFinalGoldPrice(7000, -100),
      shouldFail: true
    },
    {
      name: 'Zero base price',
      fn: () => calculateFinalGoldPrice(0, 2000),
      shouldFail: true
    },
    {
      name: 'Zero premium (valid)',
      fn: () => calculateFinalGoldPrice(7000, 0),
      shouldFail: false
    },
    {
      name: 'Very high premium',
      fn: () => calculateFinalGoldPrice(7000, 5000),
      shouldFail: false
    }
  ];
  
  for (const test of tests) {
    try {
      const result = test.fn();
      if (test.shouldFail) {
        console.log(`✗ ${test.name}: Expected to fail but succeeded with result:`, result);
      } else {
        console.log(`✓ ${test.name}: Passed with result:`, result);
      }
    } catch (error) {
      if (test.shouldFail) {
        console.log(`✓ ${test.name}: Correctly failed with error:`, 
          error instanceof Error ? error.message : 'Unknown error');
      } else {
        console.log(`✗ ${test.name}: Unexpectedly failed with error:`, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
}

async function testFullWorkflow() {
  console.log('\n=== Test 5: Full Workflow Simulation ===\n');
  
  try {
    console.log('Simulating admin workflow...\n');
    
    // Step 1: Fetch live price
    console.log('Step 1: Fetching live gold price from API...');
    const priceResult = await fetchLiveGoldPrice();
    
    if (!priceResult.success || !priceResult.basePrice) {
      throw new Error('Failed to fetch live price');
    }
    
    console.log('✓ Fetched base price:', priceResult.basePrice, '/gram\n');
    
    // Step 2: Admin sets premium
    const adminPremium = 2500; // Example premium
    console.log('Step 2: Admin sets premium:', adminPremium, '/gram\n');
    
    // Step 3: Calculate final price
    console.log('Step 3: Calculating final prices...');
    const final24K = calculateFinalGoldPrice(priceResult.basePrice, adminPremium);
    console.log('✓ Final 24K price:', final24K, '/gram\n');
    
    // Step 4: Calculate all carat prices
    console.log('Step 4: Calculating prices for all carats...');
    const allPrices = calculateCaratPrices(final24K);
    console.log('✓ All carat prices:');
    Object.entries(allPrices).forEach(([carat, price]) => {
      console.log(`  ${carat}: ₹${price.toLocaleString()}/gram`);
    });
    
    console.log('\n✓ Full workflow completed successfully!');
    console.log('\nSummary:');
    console.log('  API Base Price: ₹' + priceResult.basePrice.toLocaleString());
    console.log('  Admin Premium:  ₹' + adminPremium.toLocaleString());
    console.log('  Final 24K:      ₹' + final24K.toLocaleString());
    console.log('  Expiry Date:    ' + priceResult.expiry);
    
    return { success: true };
  } catch (error) {
    console.error('✗ Workflow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   MoneyControl API & Gold Price Service Tests   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  const results = {
    rawAPI: await testRawAPICall(),
    service: await testGoldPriceService(),
    calculations: await testPriceCalculations(),
    fullWorkflow: await testFullWorkflow()
  };
  
  await testEdgeCases();
  
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║               Test Results Summary               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  console.log('Raw API Call:         ', results.rawAPI.success ? '✓ PASSED' : '✗ FAILED');
  console.log('Gold Price Service:   ', results.service.success ? '✓ PASSED' : '✗ FAILED');
  console.log('Price Calculations:   ', results.calculations.success ? '✓ PASSED' : '✗ FAILED');
  console.log('Full Workflow:        ', results.fullWorkflow.success ? '✓ PASSED' : '✗ FAILED');
  
  const allPassed = Object.values(results).every(r => r.success);
  console.log('\n' + (allPassed ? '✓ All tests passed!' : '✗ Some tests failed'));
}

// Run all tests
runAllTests().catch(console.error);

export { testRawAPICall, testGoldPriceService, testPriceCalculations, testEdgeCases, testFullWorkflow };
