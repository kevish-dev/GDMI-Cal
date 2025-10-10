# Fixed Scanner Flow Diagram

## Complete Jewelry Tag Scanner Flow

```
┌────────────────────────────────────────────────────────┐
│                    STEP 1: Select Type                  │
│                                                          │
│  ┌──────────────┐         ┌──────────────┐            │
│  │     Gold     │   OR    │   Diamond    │            │
│  │   Jewelry    │         │   Jewelry    │            │
│  └──────────────┘         └──────────────┘            │
│                                                          │
│              [Continue Button]                          │
│         Disabled: jewelryType === null                  │
│         Enabled: jewelryType !== null                   │
└────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────┐
│                 STEP 2: Upload Images                   │
│                                                          │
│  📸 Top View (Required)                                 │
│  📸 Bottom View (Optional)                              │
│                                                          │
│  [Back] ←                        → [Continue]           │
│                                                          │
│         Disabled: images.top === null                   │
│         Enabled: images.top !== null                    │
└────────────────────────────────────────────────────────┘
                            ↓
                   [Auto Extract Text]
                            ↓
┌────────────────────────────────────────────────────────┐
│              STEP 3: Making Charges                     │
│                                                          │
│  Gold Jewelry:                                          │
│    - Select Type (Chains/Plain/Temple/Italian)         │
│    - Percentage of gold value                           │
│                                                          │
│  Diamond Jewelry:                                       │
│    - Fixed: ₹800/gram (default)                        │
│    - Can adjust if needed                               │
│                                                          │
│  [Back] ←                        → [Continue]           │
│                                                          │
│  Gold Disabled: goldType OR percentage undefined        │
│  Diamond Disabled: percentage undefined                 │
└────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────┐
│          STEP 4: Verification Questions                 │
│                                                          │
│  📊 Extracted Information Display:                      │
│     - Gross Weight                                      │
│     - Net Weight                                        │
│     - Purity (22K/18K/14K)                             │
│     - Stone/Diamond Details                             │
│     - Item Code                                         │
│                                                          │
│  Gold Questions:                                        │
│    ❓ 100% buy back guarantee?      [Yes] [No]         │
│    ❓ Seen in raw form?              [Yes] [No]         │
│                                                          │
│  Diamond Questions:                                     │
│    ❓ Appreciation on diamond?       [Yes] [No]         │
│    ❓ Certificate type?               [IGI] [Non-IGI]   │
│                                                          │
│  [Back] ←                → [Calculate & Finish] 🧮      │
│                                                          │
│  FIXED! Now triggers handleCalculatePreview()           │
│  Disabled: Not all questions answered                   │
│  Enabled: All questions answered                        │
│  Shows: Loading spinner during calculation              │
└────────────────────────────────────────────────────────┘
                            ↓
                   [Calculation Process]
                            ↓
              ┌─────────────────────────┐
              │   GOLD CALCULATION      │
              │                         │
              │ 1. Get gold weight      │
              │ 2. Get gold rate        │
              │ 3. Calculate value      │
              │ 4. Add making charges   │
              │    (% of gold value)    │
              │ 5. Final Price          │
              └─────────────────────────┘
                            OR
              ┌─────────────────────────┐
              │  DIAMOND CALCULATION    │
              │                         │
              │ 1. Get gold weight      │
              │ 2. Calculate gold value │
              │ 3. Get diamond weight   │
              │ 4. Get diamond rate     │
              │    (IGI or Self)        │
              │ 5. Calculate dia value  │
              │ 6. Add making charges   │
              │    (₹800 × gold weight) │
              │ 7. Final Price          │
              └─────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────┐
│                  VALIDATION CHECKS                      │
│                                                          │
│  ✓ Weight > 0                                           │
│  ✓ Carat/Purity exists                                 │
│  ✓ Gold rate found                                      │
│  ✓ Diamond weight > 0 (if diamond)                     │
│  ✓ All calculations valid                               │
│                                                          │
│  ❌ Show error toast if validation fails               │
└────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────┐
│               SUCCESS! Return Result                    │
│                                                          │
│  Result Object:                                         │
│  {                                                       │
│    jewelryType: "gold" | "diamond",                    │
│    extractedData: {...},                                │
│    verificationAnswers: {...},                          │
│    makingCharges: {...},                                │
│    calculatedPrice: number,                             │
│    priceBreakdown: {                                    │
│      goldRate, goldWeight, goldValue,                   │
│      diamondRate, diamondWeight, diamondValue,          │
│      makingChargeRate, makingCharges,                   │
│      subTotal, gst: 0, finalPrice                       │
│    }                                                     │
│  }                                                       │
│                                                          │
│  ✅ Show success toast                                  │
│  ✅ Close scanner                                       │
│  ✅ Display result on calculator page                   │
└────────────────────────────────────────────────────────┘
```

## Key Fixes Applied

### 🔧 Fix 1: Button Action
**Before:**
```tsx
onClick={() => setStep(4)}  // Wrong! Already on Step 4
```

**After:**
```tsx
onClick={handleCalculatePreview}  // Correct! Triggers calculation
```

### 🔧 Fix 2: Button Validation
**Before:**
```tsx
disabled={!canProceedToStep4}  // Wrong validation (checks images)
```

**After:**
```tsx
disabled={!canCalculate || isCalculating}  // Correct (checks answers)
```

### 🔧 Fix 3: Back Navigation
**Before:**
```tsx
onClick={() => setStep(2)}  // Wrong step
```

**After:**
```tsx
onClick={() => setStep(3)}  // Correct! Go to making charges
```

### 🔧 Fix 4: User Feedback
**Added:**
- Loading spinner during calculation
- "Calculate & Finish" label with calculator icon
- Success toast on completion
- Detailed error messages for failures

## Error Handling Matrix

| Scenario | Error Message | Action |
|----------|--------------|--------|
| No jewelry type | "Missing data" | Return early |
| No extracted data | "Missing data" | Return early |
| Weight ≤ 0 | "Weight must be greater than 0" | Show toast, stop |
| No carat/purity | "Purity information required" | Show toast, stop |
| Gold rate not found | "Gold rate for [X] not found" | Show toast, stop |
| Diamond weight ≤ 0 | "Diamond weight must be > 0" | Show toast, stop |
| Calculation error | "Calculation failed" | Show toast, stop |
| Success | "Scan complete!" | Close & return |

## Validation Flow

```
Step 1 → Step 2: jewelryType !== null ✓
Step 2 → Step 3: images.top !== null ✓
Step 3 → Step 4: 
  - Gold: goldType && percentage defined ✓
  - Diamond: percentage defined ✓
Step 4 → Complete:
  - Gold: buyBackGuarantee && showsRawForm defined ✓
  - Diamond: diamondAppreciation && certificationType defined ✓
```

## Testing Scenarios

### ✅ Gold Jewelry - Happy Path
1. Select Gold
2. Upload tag image
3. Select "Chains" with 15% making charge
4. Answer: Yes to buy-back, Yes to raw form
5. Click "Calculate & Finish"
6. ✓ Price calculated and displayed

### ✅ Diamond Jewelry - Happy Path
1. Select Diamond
2. Upload tag image
3. Keep default ₹800/gram making charge
4. Answer: No to appreciation, IGI certification
5. Click "Calculate & Finish"
6. ✓ Price calculated and displayed

### ✅ Error Scenario
1. Tag image with missing weight
2. Answer questions
3. Click "Calculate & Finish"
4. ✓ Error toast: "Invalid weight"

## Result Integration

The calculated result is passed to parent component:
```tsx
onScanComplete({
  jewelryType,
  extractedData,
  verificationAnswers,
  makingCharges,
  calculatedPrice,
  priceBreakdown
});
```

This displays on the Calculator page showing the complete price breakdown.
