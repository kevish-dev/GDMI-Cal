# Jewelry Tag Processing Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     JEWELRY TAG SCANNER                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TAG FORMAT DETECTION                          │
│  Supports: Green QR, Pink/Purple, Blue Barcode, White Tags      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GOOGLE GEMINI AI TEXT EXTRACTION                    │
│                                                                   │
│  Gold Tags Extract:          Diamond Tags Extract:               │
│  • G.W/N.W (weights)        • G.W/N.W (weights)                 │
│  • STN/KUN (stones)         • RD/PC (diamonds)                  │
│  • 22K/18K/14K (purity)     • CS (color stones)                 │
│  • Item codes               • Color/Clarity                      │
│  • Special notations        • ELITE/certification               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RAW DATA EXTRACTION                            │
│                                                                   │
│  Example Gold Tag:           Example Diamond Tag:                │
│  {                           {                                   │
│    "grossWeight": 117.110,     "grossWeight": 14.620,          │
│    "netWeight": 97.660,        "netWeight": 12.500,             │
│    "carat": "22K",             "carat": "14K",                  │
│    "stones": [                 "diamonds": [                     │
│      {                           {                               │
│        "type": "STONES",           "type": "RD",                │
│        "weight": 16.93             "weight": 2.01,              │
│      },                            "count": 104                 │
│      {                           }                               │
│        "type": "KUND",         ],                               │
│        "weight": 3.63,         "otherStones": [                │
│        "count": 60               {                               │
│      }                             "type": "AMETHYST",          │
│    ],                              "weight": 4.90,              │
│    "itemCode": "BG544"             "count": 1                   │
│  }                               }                               │
│                                ]                                 │
│                              }                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA NORMALIZATION                             │
│                                                                   │
│  Process:                                                        │
│  1. Calculate missing weights (gross/net calculations)           │
│  2. Sum stone arrays into totals                                │
│  3. Standardize carat format (22KT → 22K)                       │
│  4. Extract stone/diamond totals from arrays                    │
│  5. Parse special formats (backslash separators)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NORMALIZED DATA                               │
│                                                                   │
│  Gold:                       Diamond:                            │
│  • weight: 97.660g          • weight: 12.500g                   │
│  • grossWeight: 117.110g    • grossWeight: 14.620g              │
│  • netWeight: 97.660g       • netWeight: 12.500g                │
│  • carat: "22K"             • carat: "14K"                      │
│  • stoneWeight: 20.56g      • diamondWeight: 2.01ct             │
│  • itemCode: "BG544"        • otherStonesWeight: 4.90g          │
│                             • itemCode: "PR-LR-8644"             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA VALIDATION                               │
│                                                                   │
│  Gold Validation:            Diamond Validation:                 │
│  ✓ Has weight value         ✓ Has gold weight                   │
│  ✓ Has carat purity         ✓ Has diamond weight                │
│  ✓ Weight > 0               ✓ Both values > 0                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UI DISPLAY                                    │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐        │
│  │  Extracted Information                              │        │
│  │  --------------------------------------------------- │        │
│  │  Gross Weight: 117.110g    Net Weight: 97.660g     │        │
│  │  Purity: 22K               Item Code: BG544        │        │
│  │                                                     │        │
│  │  Stone Details:                                     │        │
│  │  • STONES: 16.93g                                   │        │
│  │  • KUND: 3.63g (60 pcs)                            │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERIFICATION & MAKING CHARGES                       │
│  • Buy-back guarantee questions                                 │
│  • Raw form verification                                        │
│  • Making charge calculation                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRICE CALCULATION                             │
│                                                                   │
│  Gold Price = (Net Weight × Gold Rate) + Making Charges         │
│  Diamond Price = (Gold Value) + (Diamond Weight × Diamond Rate) │
│                + Making Charges                                  │
│                                                                   │
│  Final Price = Subtotal (No GST)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Tag Format Processing Examples

### Example 1: Green QR Code Tag (Gold)
```
Input Image:
┌─────────────────┐
│  BG544 / 22K    │
│                 │
│  G.W: 117.110   │
│  N.W: 97.660    │
│  STONES: 16.93  │
│  KUND: 3.63\60  │
│                 │
│  [QR CODE]      │
└─────────────────┘

AI Extraction → {
  "itemCode": "BG544",
  "carat": "22K",
  "grossWeight": 117.110,
  "netWeight": 97.660,
  "stones": [
    {"type": "STONES", "weight": 16.93},
    {"type": "KUND", "weight": 3.63, "count": 60}
  ]
}

Normalization → {
  "weight": 97.660,
  "stoneWeight": 20.56  // 16.93 + 3.63
}
```

### Example 2: Pink Diamond Tag
```
Input Image:
┌─────────────────┐
│  PR-LR-8644     │
│      567        │
│      14K        │
│                 │
│  G.Wt: 14.620   │
│  RD: PC-104\2.01│
│  AMETHYST:      │
│  PC-1\4.90      │
└─────────────────┘

AI Extraction → {
  "itemCode": "PR-LR-8644",
  "carat": "14K",
  "grossWeight": 14.620,
  "diamonds": [
    {"type": "RD", "weight": 2.01, "count": 104}
  ],
  "otherStones": [
    {"type": "AMETHYST", "weight": 4.90, "count": 1}
  ]
}

Normalization → {
  "diamondWeight": 2.01,
  "otherStonesWeight": 4.90,
  "netWeight": 7.730  // 14.620 - 2.01 - 4.90
}
```

### Example 3: Complex Stone Tag
```
Input Image:
┌─────────────────┐
│  G.W: 74.310    │
│  N.W: 58.263    │
│                 │
│  STN: 1.250\1000│
│  STN: 13.010\300│
│  KUN: 1.787\Pc39│
└─────────────────┘

AI Extraction → {
  "grossWeight": 74.310,
  "netWeight": 58.263,
  "stones": [
    {"type": "STN", "weight": 2.250},  // 1.250 + 1.000
    {"type": "STN", "weight": 13.310}, // 13.010 + 0.300
    {"type": "KUN", "weight": 1.787, "count": 39}
  ]
}

Normalization → {
  "stoneWeight": 17.347  // Sum all stones
}

Verification → ✓ Matches: 74.310 - 58.263 ≈ 16.047
```

## Special Format Handlers

### Backslash Separator (`\`)
- `1.250\1000` → Parse as two values, sum them → 2.250
- `Kun: 6.245\120` → Weight: 6.245, Count: 120
- `PC-104\2.01` → Count: 104, Weight: 2.01

### Stone Type Parsing
- `STN PIROI: 31.750` → Type: "STN PIROI", Weight: 31.750
- `RD:- PC-104\2.01` → Type: "RD", Count: 104, Weight: 2.01
- `ELITE` → Special designation for premium diamonds

### Item Code Recognition
- Alphanumeric: `BG544`, `GCS029`, `ER1635`
- With hyphens: `PR-LR-9127`, `DLR9658`
- Numbers: `567`, `1181`

## Quality Assurance

### Validation Checks
1. ✓ Required fields present
2. ✓ Numeric values valid
3. ✓ Calculations consistent
4. ✓ Carat format standardized
5. ✓ No negative values

### Error Recovery
- Missing data → Use available fields
- Parse errors → Show raw text
- Invalid values → Request re-scan
- Calculation mismatches → Alert user
