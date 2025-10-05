# Jewelry Tag Scanner - Feature Showcase

## 🎨 Visual Design & Layout

### Main Calculator Page Integration

```
┌─────────────────────────────────────────────────────────┐
│  📊 Live Gold Rate Marquee                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ⚡ QUICK SCAN Section (NEW!)                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 📱 Scan Jewelry Tag                               │  │
│  │ Scan jewelry tag to auto-fill details             │  │
│  │                                                    │  │
│  │  [🔵 Scan Jewelry Tag Button]                     │  │
│  │  "Upload images for instant price calculation"    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

                        OR
                    ─────────

┌─────────────────────────────────────────────────────────┐
│  Select Jewelry Type                                    │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  👑 Gold     │  │  💎 Diamond  │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📸 Scanner Modal - Step by Step

### Step 1: Jewelry Type Selection

```
┌─────────────────────────────────────────────────────┐
│  📷 Scan Jewelry Tag              [X]                │
│  Step 1 of 3                                         │
│  ████████████░░░░░░░░░░░░░░ 33%                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│         Select Jewelry Type                          │
│    Choose the type of jewelry you want to scan       │
│                                                      │
│  ┌─────────────────┐    ┌─────────────────┐        │
│  │                 │    │                 │        │
│  │      👑         │    │       💎        │        │
│  │                 │    │                 │        │
│  │      Gold       │    │    Diamond      │        │
│  │                 │    │                 │        │
│  └─────────────────┘    └─────────────────┘        │
│                                                      │
│                           [Continue →]              │
└─────────────────────────────────────────────────────┘
```

---

### Step 2: Image Upload (Before Uploading)

```
┌─────────────────────────────────────────────────────┐
│  📷 Scan Jewelry Tag              [X]                │
│  Step 2 of 3                                         │
│  ████████████████████░░░░ 66%                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│         📸 Upload Tag Images                         │
│    Upload at least one clear image of the tag       │
│    (top view required, bottom view optional)         │
│                                                      │
│      ⚡ Scanning Mode Active                        │
│                                                      │
│  Top View [Required]      Bottom View [Optional]    │
│  ┌─────────────┐          ┌─────────────┐          │
│  │             │          │             │          │
│  │      📤     │          │      📤     │          │
│  │  Click to  │          │  Click to  │          │
│  │   upload   │          │   upload   │          │
│  │             │          │             │          │
│  └─────────────┘          └─────────────┘          │
│                                                      │
│  [← Back]                    [Scan & Extract 📷]    │
└─────────────────────────────────────────────────────┘
```

---

### Step 2: Image Upload (After Uploading)

```
┌─────────────────────────────────────────────────────┐
│  📷 Scan Jewelry Tag              [X]                │
│  Step 2 of 3                                         │
│  ████████████████████░░░░ 66%                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│         📸 Upload Tag Images                         │
│    Upload clear images of the jewelry tag           │
│                                                      │
│      ⚡ Scanning Mode Active                        │
│                                                      │
│  Top View [Required]      Bottom View [Required]    │
│  ┌─────────────┐          ┌─────────────┐          │
│  │   [Image]   │          │   [Image]   │          │
│  │  ┌───────┐  │          │  ┌───────┐  │          │
│  │  │ Tag   │  │          │  │ Tag   │  │          │
│  │  │ Photo │  │ ✅       │  │ Photo │  │ ✅       │
│  │  └───────┘  │          │  └───────┘  │          │
│  │   [Remove]  │          │   [Remove]  │          │
│  └─────────────┘          └─────────────┘          │
│                                                      │
│  [← Back]                    [Scan & Extract 📷]    │
└─────────────────────────────────────────────────────┘
```

---

### Step 2: Extracting (Loading State)

```
┌─────────────────────────────────────────────────────┐
│  📷 Scan Jewelry Tag              [X]                │
│  Step 2 of 3                                         │
│  ████████████████████░░░░ 66%                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │                                              │   │
│  │              ⏳ (spinning)                   │   │
│  │                                              │   │
│  │          Extracting Text...                  │   │
│  │     Analyzing jewelry tag images             │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

### Step 3: Verification Questions (Gold)

```
┌─────────────────────────────────────────────────────┐
│  📷 Scan Jewelry Tag              [X]                │
│  Step 3 of 3                                         │
│  ████████████████████████████████ 100%              │
├─────────────────────────────────────────────────────┤
│                                                      │
│      Verification Questions                          │
│   Answer these questions to get accurate pricing     │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ ✅ Extracted Information                     │   │
│  │  Weight:      15.5 grams                     │   │
│  │  Carat:       22K                            │   │
│  │  Net Weight:  14.2 grams                     │   │
│  │  Item Code:   GN-1234                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Does your jeweller give 100% buy back       │   │
│  │ on gold weight?                              │   │
│  │  ○ Yes   ○ No                                │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Does your jeweller show you the raw form    │   │
│  │ of jewelry (without stone/kundan)?           │   │
│  │  ○ Yes   ○ No                                │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  [← Back]                    [Complete Scan →]      │
└─────────────────────────────────────────────────────┘
```

---

### Step 3: Verification Questions (Diamond)

```
┌─────────────────────────────────────────────────────┐
│  📷 Scan Jewelry Tag              [X]                │
│  Step 3 of 3                                         │
│  ████████████████████████████████ 100%              │
├─────────────────────────────────────────────────────┤
│                                                      │
│      Verification Questions                          │
│   Answer these questions to get accurate pricing     │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ ✅ Extracted Information                     │   │
│  │  Gold Weight:    5.2 grams                   │   │
│  │  Carat:          18K                         │   │
│  │  Diamond Weight: 0.75 carats                 │   │
│  │  Color:          GH                          │   │
│  │  Clarity:        VS1                         │   │
│  │  Item Code:      DR-5678                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Does your jeweller give appreciation         │   │
│  │ on diamond?                                  │   │
│  │  ○ Yes   ○ No                                │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Select type of certificate on diamond        │   │
│  │  ○ IGI Certified   ○ Non-IGI (Self Cert)     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  [← Back]            [Calculate & Complete →]       │
└─────────────────────────────────────────────────────┘

Note: Price is automatically calculated when you 
      click "Calculate & Complete" - no manual 
      calculation step required!
```
```

---

## 🎨 Color Scheme

### Gold Theme:
- **Primary Color**: Warm gold tones (#FFD700 family)
- **Gradient**: from-primary/5 to-primary/10
- **Icons**: Crown (👑)
- **Border**: border-primary/30

### Diamond Theme:
- **Secondary Color**: Cool diamond tones (#E0F2FE family)
- **Gradient**: from-secondary/5 to-secondary/10
- **Icons**: Diamond (💎)
- **Border**: border-secondary/30

### Common Elements:
- **Success**: Green (#10B981)
- **Loading**: Primary with spin animation
- **Error**: Red/Destructive (#EF4444)
- **Muted**: Gray tones for secondary text

---

## ⚡ Interactive States

### Button States:

**Scan Button (Main Page)**
```
┌──────────────────────────────────────┐
│  📷 Scan Jewelry Tag                 │  ← Default
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  📷 Scan Jewelry Tag                 │  ← Hover (brighter)
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  ⏳ Extracting...                    │  ← Loading
└──────────────────────────────────────┘
```

### Upload Area States:

**Empty**
```
┌─────────────┐
│             │
│      📤     │  ← Dashed border
│  Click to  │
│   upload   │
│             │
└─────────────┘
```

**Hover**
```
┌─────────────┐
│             │
│      📤     │  ← Primary border, bg tint
│  Click to  │
│   upload   │
│             │
└─────────────┘
```

**Uploaded**
```
┌─────────────┐
│   [Image]   │
│  ┌───────┐  │  ← Solid primary border
│  │ Photo │  │
│  └───────┘  │ ✅
│   [Remove]  │
└─────────────┘
```

---

## 📱 Mobile Responsive Layouts

### Mobile View (< 640px):

```
┌─────────────────┐
│ 📷 Quick Scan   │
│ ┌─────────────┐ │
│ │   Scan Tag  │ │
│ └─────────────┘ │
└─────────────────┘
        OR
┌─────────────────┐
│ Select Type     │
│ ┌─────────────┐ │
│ │  👑 Gold    │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │  💎 Diamond │ │
│ └─────────────┘ │
└─────────────────┘
```

### Tablet View (640px - 1024px):

```
┌───────────────────────────┐
│ 📷 Quick Scan             │
│ ┌───────────────────────┐ │
│ │  Scan Jewelry Tag     │ │
│ └───────────────────────┘ │
└───────────────────────────┘
             OR
┌───────────────────────────┐
│ Select Jewelry Type       │
│ ┌──────────┐ ┌──────────┐│
│ │👑 Gold   │ │💎 Diamond││
│ └──────────┘ └──────────┘│
└───────────────────────────┘
```

---

## 🎭 Animation Examples

### Pulsing Scan Icon:
```
Frame 1:  📷 ●●○○ (100% opacity)
Frame 2:  📷 ●●●○ (80% opacity)
Frame 3:  📷 ●●●● (60% opacity)
Frame 4:  📷 ●●●○ (80% opacity)
Repeat...
```

### Loading Spinner:
```
⏳ → Rotating 360° continuously
Plus background blur pulse effect
```

### Progress Bar:
```
Step 1: ████████░░░░░░░░░░░░ 33%
Step 2: ████████████████░░░░ 66%
Step 3: ████████████████████ 100%
```

---

## ✨ Special Effects

1. **Gradient Backgrounds**: Subtle gradients matching jewelry type
2. **Backdrop Blur**: Modal overlay with blur effect
3. **Shadow Effects**: Elevation shadows on cards
4. **Hover States**: Interactive feedback on all clickable elements
5. **Fade Transitions**: Smooth step changes
6. **Badge Animations**: "NEW" badge with subtle pulse
7. **Icon Glows**: Glow effects on active scan icon

---

## 🎯 User Flow Visualization

```
   START
     ↓
[Calculator Page]
     ↓
[Click "Scan Jewelry Tag"]
     ↓
┌─────────────────┐
│    STEP 1       │
│  Select Type    │
│  (Gold/Diamond) │
└─────────────────┘
     ↓
┌─────────────────┐
│    STEP 2       │
│  Upload Images  │
│  (Top + Bottom) │
│      ↓          │
│  AI Extraction  │
└─────────────────┘
     ↓
┌─────────────────┐
│    STEP 3       │
│  Show Extracted │
│     Data        │
│      ↓          │
│  Ask Questions  │
│      ↓          │
│ AUTO CALCULATE  │
│  PRICE (No MC)  │
└─────────────────┘
     ↓
[Price Displayed]
     ↓
[Scanner Closes]
     ↓
[Form Auto-filled]
     ↓
[Price Shown]
     ↓
    END

Note: MC = Making Charges (not included)
```

---

This visual showcase demonstrates the complete user interface and experience of the Jewelry Tag Scanner feature!
