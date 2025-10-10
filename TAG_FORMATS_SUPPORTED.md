# Supported Jewelry Tag Formats

This document outlines all the jewelry tag formats that the GDMI-Cal application can recognize and extract information from.

## Overview

The AI-powered tag scanner can handle various tag formats commonly used in jewelry retail, including:
- Green/mint colored tags with QR codes
- Blue/light colored tags with barcodes
- Pink/purple tags with printed text
- White tags with printed information

## Gold Jewelry Tags

### Supported Abbreviations

| Abbreviation | Meaning | Example |
|--------------|---------|---------|
| **G.W / G.Wt / GW** | Gross Weight (total weight) | `G.W: 144.180` = 144.180 grams |
| **N.W / N.Wt / NW** | Net Weight (pure gold weight) | `N.W: 103.235` = 103.235 grams |
| **STN / Stn / STONES** | Stone weight | `Stn: 4.81` = 4.81 grams |
| **KUN / Kun / KUND** | Kundan weight | `Kun: 6.245` = 6.245 grams |
| **ICS** | Additional stone information | `ICS: 2.950` |
| **Purity** | Gold purity | `22K`, `18K`, `14K`, `22KT` |

### Example Tag Formats

#### Format 1: Basic Weight Information
```
G.W. 144.180
N.W. 103.235
Stn PIROI: 31.750
ICS: 2.950
Kun: 6.245\120
```

#### Format 2: QR Code Tags
```
BG544 / 22K
G.W: 117.110
N.W: 97.660
P.STONES: 16.93
KUND: 3.63\60
[QR Code Present]
```

#### Format 3: Complex Stone Breakdown
```
G.W: 74.310
N.W: 58.263
STN: 1.250\1000
STN: 13.010\300
KUN: 1.787\Pc39
```

#### Format 4: Simple Format
```
DLR9658
G.Wt: 11.460
N.Wt: 10.174 750/Gm
```

### Special Notations

1. **Backslash Separator** (`\`): Used to separate multiple values
   - `1.250\1000` = Two values: 1.250 and 1.000 (should be summed)
   - `Kun: 6.245\120` = Kundan weight 6.245g, 120 pieces

2. **Multiple Stone Entries**: Tags may have multiple stone type entries
   ```
   STN: 1.250\1000
   STN: 13.010\300
   KUN: 1.787\Pc39
   ```

3. **Item Codes**: Various formats
   - `BG544`, `GCS029`, `DLR9658`, `OLRB874`, etc.

## Diamond Jewelry Tags

### Supported Abbreviations

| Abbreviation | Meaning | Example |
|--------------|---------|---------|
| **G.W / G.Wt** | Gross Weight (total weight) | `G.Wt: 9.830` |
| **N.W / N.Wt** | Net Weight (gold weight) | `N.Wt: 8.500` |
| **RD / Rd** | Round Diamond | `RD:- PC-104\2.01` |
| **PC** | Pear Cut / Piece Count | `PC-249\1.36` |
| **CS** | Color Stone | `CS:- PC-1\2.15` |
| **DIA / Dia** | Diamond | `Dia: 1.62\ELITET` |
| **ELITE / ELITET** | Elite grade diamonds | `ELITE` |
| **Purity** | Gold purity | `22K`, `18K`, `14K` |

### Example Tag Formats

#### Format 1: Round Diamond with Count
```
G.Wt :- 9.830
RD:- PC-251\52
RD:- PC-65\1.06
```

#### Format 2: Multiple Stone Types
```
G.Wt :- 14.620
RD:- PC-104\2.01
AMETHYST:- PC-1\4.90/567
```

#### Format 3: Pear Cut Diamonds
```
G.Wt :- 10.520
RD:- PC-186\2.52
CS:- PC-122\0.85
```

#### Format 4: Elite Diamonds
```
DLR9658 14K
Dia: 1.62\ELITET
Stn: 4.81\CS
```

#### Format 5: Simple Format
```
PR-LR-8644
567          14K
```

### Diamond Specifications

When available, tags may include:
- **Color Grades**: D, E, F, G, H, I, J, K, L
- **Clarity Grades**: IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1, I2, I3
- **Certification Numbers**: Various formats

### Special Notations

1. **Piece Count Format**: `PC-249\1.36`
   - `PC-249` = 249 pieces
   - `1.36` = Total weight 1.36 carats

2. **Stone Type Notation**: `RD:- PC-104\2.01`
   - `RD` = Round Diamond
   - `PC-104` = 104 pieces
   - `2.01` = 2.01 carats total

3. **Multiple Values**: When backslash is present
   - First value: Usually piece count
   - Second value: Weight in carats

## Common Features Across All Tags

### Tag Colors
- **Green/Mint**: Often with QR codes
- **Pink/Purple**: Typically for premium items
- **Blue/Light**: Standard tags with barcodes
- **White**: Basic printed tags

### Always Extracted When Present
1. **Item Code** - Unique identifier
2. **Gross Weight (G.W)** - Total weight including stones
3. **Net Weight (N.W)** - Pure gold/metal weight
4. **Purity/Carat** - Metal purity (22K, 18K, 14K)
5. **Stone Information** - Type, weight, count
6. **Diameter** - If mentioned (e.g., `Dia: 2.50`)

## Data Normalization

The application automatically:
1. **Sums multiple values** separated by backslash
2. **Calculates missing weights**:
   - If Net Weight and Stone Weight are known, Gross Weight is calculated
   - If Gross Weight and Stone Weight are known, Net Weight is calculated
3. **Standardizes carat format**: Converts `22KT` to `22K`
4. **Organizes stone data** into structured arrays for easy display

## Validation

For successful extraction:
- **Gold Jewelry**: Must have at least weight OR netWeight OR grossWeight
- **Diamond Jewelry**: Must have gold weight AND diamond weight

## Error Handling

If text extraction fails:
- Clear error message displayed
- User can retake photos
- Extracted raw text shown for debugging (if available)

## Best Practices for Scanning

1. **Lighting**: Ensure good lighting, avoid glare
2. **Focus**: Keep tag text clear and in focus
3. **Angle**: Hold camera perpendicular to tag
4. **Distance**: Close enough to read text clearly
5. **Stability**: Hold camera steady to avoid blur
6. **Coverage**: Ensure all text is visible in frame

## Future Enhancements

Potential improvements:
- Support for additional languages (Hindi, regional)
- Handwritten tag recognition
- Multiple tag batch processing
- Tag format learning/adaptation
