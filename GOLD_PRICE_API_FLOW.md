# Gold Price API Integration - Flow Documentation

## Overview

This document explains the automated gold price management system that fetches live gold prices from MoneyControl API and allows admins to add a premium before final pricing.

## Architecture

### 1. **Gold Price Service** (`src/services/goldPriceService.ts`)

The core service that handles API communication and price calculations.

#### Key Functions:

- `fetchLiveGoldPrice()`: Main function that orchestrates the API calls
- `calculateFinalGoldPrice(basePrice, premium)`: Adds admin premium to base price
- `calculateCaratPrices(final24KPrice)`: Calculates prices for all carat types

### 2. **Firestore Service** (`src/services/firestore.js`)

Manages the gold premium configuration in Firebase.

#### New Functions Added:

- `getGoldPremiumConfig()`: Retrieves current premium configuration
- `updateGoldPremiumConfig(config)`: Updates premium configuration
- `subscribeToGoldPremiumConfig(callback)`: Real-time updates for premium config

### 3. **Rates Context** (`src/contexts/RatesContext.tsx`)

Enhanced to support gold premium configuration and API-based pricing.

#### New State:

```typescript
interface GoldPremiumConfig {
  premium: number;           // Premium per gram to add to base price
  basePrice: number;         // Last fetched base price from API (per gram)
  lastApiPrice: number;      // Raw price from API (for 10g)
  lastUpdated?: any;         // Timestamp of last update
  autoUpdateEnabled: boolean; // Future: Enable auto-refresh
  expiry?: string | null;    // MCX contract expiry date
}
```

#### New Functions:

- `updateGoldPremium(config)`: Update premium configuration
- `fetchAndUpdateGoldPrice()`: Fetch from API and update all rates

### 4. **Admin Panel** (`src/pages/Admin.tsx`)

New UI for managing gold prices with API integration.

## Complete Flow

### Step 1: Fetch Default Expiry

```
GET https://www.moneycontrol.com/commodity/mcx-gold-price/?type=futures
```

- Parse HTML response
- Extract expiry date using pattern: `"default_expiry":["` ... `","`
- Example expiry: `2025-12-05`

### Step 2: Fetch Gold Price

```
GET https://priceapi.moneycontrol.com/pricefeed/mcx/commodityfutures/GOLD?expiry={expiry}
```

- Fetch price data for extracted expiry
- Extract `lastPrice` from response (price for 10g)
- Example response:
  ```json
  {
    "data": {
      "pricecurrent": "122050.00",
      "lastprice": "122050.00"
    }
  }
  ```

### Step 3: Calculate Base Price Per Gram

```javascript
// MCX price is for 10g, convert to per gram
basePricePerGram = priceFor10g / 10
// Example: 122050 / 10 = 12205.00
```

### Step 4: Add Admin Premium

```javascript
// Admin sets premium (e.g., 2000 per gram)
final24KPrice = basePricePerGram + premium
// Example: 12205 + 2000 = 14205
```

### Step 5: Calculate All Carat Prices

Using accurate conversion factors:

- **24K**: 100% = ₹14,205/g
- **22K**: 91.6% = ₹13,012/g
- **18K**: 75% = ₹10,654/g
- **14K**: 58.5% = ₹8,310/g

### Step 6: Update Database & UI

- Save premium config to Firestore
- Update gold rates for all carats
- Log activity for audit trail
- Real-time sync across all clients

## Admin Panel Usage

### 1. **Fetch Live Price**

1. Navigate to Admin Dashboard → Gold Rates tab
2. View current base price and premium in "Live Gold Price" card
3. Click "Fetch Live Price & Update" button
4. System fetches latest price from API
5. Automatically calculates and updates all carat prices

### 2. **Set/Update Premium**

1. Enter premium amount (e.g., 2000) in the Premium field
2. Click "Set" button
3. If base price exists, rates are recalculated immediately
4. Premium is saved and persists across sessions

### 3. **View Price Breakdown**

The card shows:
- Base Price (from API)
- Premium (admin-defined)
- Final 24K Price (base + premium)
- MCX contract expiry date

### 4. **Manual Update (Legacy)**

For backward compatibility, manual entry is still available:
- Enter 24K rate directly
- System calculates other carats
- Bypasses API completely

## Error Handling

### Edge Cases Covered:

1. **API Unavailable**: Clear error message, allows manual entry
2. **Invalid Expiry**: Retry mechanism or fallback
3. **Negative Premium**: Validation prevents negative values
4. **Zero Base Price**: Warning shown, requires fetch first
5. **Network Timeout**: Graceful degradation
6. **Malformed Response**: Robust parsing with multiple fallback locations

## Price Calculation Formulas

### Conversion Factors (Industry Standard):

- **22K**: 91.6% purity (22/24)
- **18K**: 75% purity (18/24)
- **14K**: 58.5% purity (14/24)

### Example Calculation:

```
API Price (10g): ₹122,050
Base Price/g:    ₹12,205  (122050 ÷ 10)
Premium:         ₹2,000
Final 24K:       ₹14,205  (12205 + 2000)

22K: ₹14,205 × 0.916 = ₹13,012/g
18K: ₹14,205 × 0.75  = ₹10,654/g
14K: ₹14,205 × 0.585 = ₹8,310/g
```

## Testing

### Run Tests:

```bash
# Run comprehensive test suite
bun src/tests/moneycontrol-api.test.ts
```

### Test Coverage:

1. ✓ Raw API calls
2. ✓ Gold price service functions
3. ✓ Price calculations
4. ✓ Edge cases (negative values, zero prices, etc.)
5. ✓ Full workflow simulation

## Database Schema

### Firestore Collection: `goldConfig/premium`

```javascript
{
  premium: 2000,              // Number: Premium per gram
  basePrice: 12205,           // Number: Last API base price
  lastApiPrice: 122050,       // Number: Raw 10g price from API
  lastUpdated: Timestamp,     // Firestore timestamp
  autoUpdateEnabled: false,   // Boolean: Future auto-refresh
  expiry: "2025-12-05"       // String: MCX contract expiry
}
```

### Firestore Collection: `goldRates/current`

```javascript
{
  rates: [
    {
      carat: "24K",
      rate: 14205,
      lastRate: 14000,
      lastUpdated: "2025-10-23"
    },
    // ... more carats
  ],
  lastUpdated: Timestamp
}
```

## Activity Logging

All price updates are logged:

```javascript
{
  type: 'rates',
  action: 'Gold prices updated from API',
  description: 'Base: ₹12,205/g, Premium: ₹2,000/g, Final 24K: ₹14,205/g',
  icon: 'TrendingUp',
  timestamp: Timestamp
}
```

## Future Enhancements

1. **Auto-refresh**: Periodic API calls (e.g., every 5 minutes)
2. **Historical Data**: Track price changes over time
3. **Price Alerts**: Notify when price crosses thresholds
4. **Multiple Sources**: Aggregate from multiple APIs
5. **Caching**: Reduce API calls with intelligent caching
6. **Webhook Support**: Real-time push updates from MCX

## Security Considerations

1. **API Rate Limiting**: Implement request throttling
2. **CORS Proxy**: May need proxy for production
3. **Input Validation**: All numeric inputs validated
4. **Admin Auth**: Premium changes require admin role
5. **Audit Trail**: All changes logged with timestamp and user

## Troubleshooting

### Common Issues:

**"Could not find default_expiry in response"**
- MCX website structure may have changed
- Check if website is accessible
- Update parsing logic if needed

**"Failed to fetch gold price: 403"**
- API may block direct browser requests
- Consider using a backend proxy
- Add proper headers (User-Agent)

**"Premium cannot be negative"**
- Validation working correctly
- Enter positive premium value

**"Base price must be greater than 0"**
- Fetch live price first
- Or use manual entry

## API Response Examples

### Expiry Page Response (Excerpt):

```html
<script>
  var default_expiry = ["2025-12-05","2025-11-05"];
  // ... more data
</script>
```

### Price API Response:

```json
{
  "data": {
    "SC": "GOLD",
    "pricecurrent": "122050.00",
    "lastprice": "122050.00",
    "pricechange": "450.00",
    "pricepercentchange": "0.37",
    // ... more fields
  }
}
```

## Maintenance

### Regular Checks:

1. Verify API endpoints are still active
2. Check parsing logic matches current HTML structure
3. Monitor error logs for API failures
4. Update conversion factors if industry standards change
5. Review and optimize Firebase queries

## Support

For issues or questions:
1. Check test results: `bun src/tests/moneycontrol-api.test.ts`
2. Review browser console for detailed errors
3. Check Firestore for data integrity
4. Verify Firebase security rules allow admin writes
