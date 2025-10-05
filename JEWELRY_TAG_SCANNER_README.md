# Jewelry Tag Scanner Feature

## Overview
The Jewelry Tag Scanner is a new feature that allows users to quickly calculate jewelry prices by scanning images of jewelry tags. This feature uses AI-powered OCR (Optical Character Recognition) to extract information from tag images and automatically populate the calculator form.

## Features

### 🎯 3-Step Scanning Process

#### Step 1: Jewelry Type Selection
- Users select whether they're scanning a **Gold** or **Diamond** jewelry tag
- Clean, intuitive UI with visual icons for each type
- Progress bar shows current step (1 of 3)

#### Step 2: Image Upload
- Users upload exactly **2 images** of the same jewelry tag:
  - **Top View**: Front/top side of the tag
  - **Bottom View**: Back/bottom side of the tag
- Features:
  - Drag-and-drop or click to upload
  - Image preview with remove option
  - Real-time validation (only image files accepted)
  - Visual feedback with checkmarks when images are uploaded
  - "Scanning Mode Active" indicator for enhanced UX
  - Loading animation during OCR extraction

#### Step 3: Verification Questions
After text extraction, users answer specific questions based on jewelry type:

**For Gold Jewelry:**
1. Does your jeweller give 100% buy back on gold weight?
2. Does your jeweller show you the raw form of jewelry (without stone/kundan)?

**For Diamond Jewelry:**
1. Does your jeweller give appreciation on diamond?
2. Select type of certificate on diamond (IGI or Non-IGI)

## Technology Stack

### AI/OCR Integration
- **Google Generative AI (Gemini 1.5 Flash)**: Powers the text extraction from images
- Extracts structured JSON data from jewelry tag images
- High accuracy text recognition optimized for jewelry tags

### Extracted Data Fields

**Gold Jewelry:**
- Weight (grams)
- Carat (14K, 18K, 22K)
- Gross Weight (with stones)
- Net Weight (gold only)
- Stone Weight
- Purity percentage
- Item/Product code
- Jewelry type

**Diamond Jewelry:**
- Gold weight (grams)
- Gold carat
- Diamond weight (carats)
- Diamond color grade
- Diamond clarity grade
- Stone weight
- Gross/Net weight
- Item code
- Certification number

## User Experience

### Scan-Like UI
The interface is designed to feel like a scanning experience:
- Pulsing scan line icon
- "Scanning Mode Active" badge
- Animated loading states during extraction
- QR-code-inspired visual elements
- Smooth transitions between steps
- Real-time progress indication

### Mobile Responsive
- Fully responsive design optimized for mobile devices
- Touch-friendly upload areas
- Mobile-optimized image preview
- Adaptive layouts for different screen sizes

## Implementation Files

### Components
1. **`JewelryTagScanner.tsx`** (`/src/components/`)
   - Main scanner component with 3-step wizard
   - Image upload interface
   - Verification questions form
   - Modal overlay with backdrop

### Services
2. **`getText.js`** (`/src/utils/`)
   - Google Gemini AI integration
   - Image-to-base64 conversion
   - JSON data extraction
   - Error handling and validation
   - Browser-compatible implementation

### Integration
3. **`Calculator.tsx`** (updated)
   - Added "Quick Scan" section above jewelry type selection
   - Integrated scanner modal
   - Auto-populates form with extracted data
   - Seamless workflow between scanning and manual entry

## Setup Instructions

### 1. Environment Configuration
Add your Google Gemini API key to your `.env` file:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Dependencies
All required dependencies are already installed:
- `@google/generative-ai` - For OCR/AI text extraction
- Existing UI components from shadcn/ui

### 3. Usage Flow
1. User clicks "Scan Jewelry Tag" button on Calculator page
2. Scanner modal opens with Step 1
3. User selects jewelry type (Gold or Diamond)
4. User uploads top and bottom view images
5. AI extracts text from images (with loading animation)
6. User answers verification questions
7. Scanner closes and form is auto-populated with extracted data
8. User can review, modify, and calculate price

## Data Flow

```
User Uploads Images 
  ↓
Convert to Base64
  ↓
Send to Gemini AI
  ↓
Extract JSON Data
  ↓
Display in Step 3
  ↓
User Answers Questions
  ↓
Complete Scan
  ↓
Auto-populate Calculator Form
  ↓
User Reviews & Calculates
```

## Error Handling

### Image Upload Validation
- Only image files accepted
- Both images required to proceed
- Clear error messages for invalid files

### OCR Extraction
- Retry mechanism on failure
- User-friendly error messages
- Fallback to manual entry if extraction fails

### Data Validation
- Validates extracted data structure
- Handles missing or incomplete data gracefully
- Allows user to manually correct any fields

## UI/UX Highlights

### Visual Design
- Gradient backgrounds matching jewelry type (gold/diamond)
- Animated icons and loading states
- Scan-line animation for scanning feel
- Badge indicators for new feature
- Color-coded sections (primary for gold, secondary for diamond)

### Accessibility
- Clear labels and descriptions
- Keyboard navigation support
- Screen reader friendly
- High contrast UI elements
- Touch-friendly tap targets

### Performance
- Optimized image handling
- Efficient base64 conversion
- Minimal re-renders
- Fast AI response times

## Future Enhancements

Potential improvements for future versions:
1. Batch scanning (multiple tags at once)
2. Camera integration for direct capture
3. Offline OCR capability
4. History of scanned items
5. Export scan results
6. AI confidence score display
7. Manual text correction interface
8. Support for more tag formats

## Best Practices for Users

### For Best Results:
1. **Good Lighting**: Take photos in well-lit conditions
2. **Clear Focus**: Ensure tag text is sharp and readable
3. **Full Coverage**: Capture entire tag in frame
4. **Avoid Glare**: Minimize reflections on tag surface
5. **Both Sides**: Upload both top and bottom views as instructed

### Common Issues:
- **Blurry images**: Retake with better focus
- **Poor lighting**: Use better light source
- **Partial tag**: Ensure entire tag is visible
- **Wrong orientation**: Ensure tag is right-side up

## Support

For issues or questions:
- Check image quality and lighting
- Ensure both images are uploaded
- Verify Gemini API key is configured
- Try manual entry as fallback
- Contact support through the app's support section

---

**Note**: This feature requires an active internet connection to use the AI-powered text extraction service.
