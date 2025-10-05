# Quick Start: Jewelry Tag Scanner

## 🚀 Setup in 3 Steps

### 1. Get Your API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### 2. Configure Environment
1. Copy `sample.env` to `.env` in the project root
2. Add your API key:
   ```env
   VITE_GEMINI_API_KEY=your_copied_api_key_here
   ```

### 3. Run the App
```bash
npm install
npm run dev
```

## 🎯 How to Use

### Scanning a Jewelry Tag

1. **Open the Calculator**
   - Navigate to the calculator page

2. **Click "Scan Jewelry Tag"**
   - Look for the blue "Quick Scan" section at the top
   - Click the prominent scan button

3. **Select Jewelry Type**
   - Choose either Gold or Diamond
   - Click "Continue"

4. **Upload Images** (1-2 images)
   - **Top View**: Click and upload front/top of tag (Required)
   - **Bottom View**: Click and upload back/bottom of tag (Optional - for better accuracy)
   - Wait for AI to extract text (shows loading animation)

5. **Answer Questions**
   - For **Gold**: 
     * Buy-back guarantee?
     * Shows raw form?
   - For **Diamond**:
     * Diamond appreciation?
     * Certificate type (IGI/Non-IGI)?

6. **Get Instant Price**
   - Price is calculated automatically
   - No making charges included
   - Results displayed immediately
   - No manual calculation needed!

## 📸 Photo Tips for Best Results

### ✅ DO:
- Take photos in good lighting
- Keep tag flat and focused
- Capture entire tag in frame
- Ensure text is readable
- Clean the tag if dirty
- Hold camera steady

### ❌ DON'T:
- Use blurry images
- Take photos in dim light
- Cut off parts of the tag
- Include glare or reflections
- Use extreme angles
- Rush the photo

## 🎨 What You'll See

### Visual Elements:
- 🔵 Blue gradient scan button
- 📊 Progress bar (Step X of 3)
- ⚡ Pulsing scan icon
- ✅ Green checkmarks on uploaded images
- ⏳ Loading spinner during extraction
- 🎯 "Scanning Mode Active" badge

## 🔍 Extracted Information

### Gold Jewelry:
- Weight (grams)
- Carat (14K/18K/22K)
- Net/Gross weight
- Stone weight
- Purity
- Item code

### Diamond Jewelry:
- Gold weight & carat
- Diamond weight (carats)
- Diamond color
- Diamond clarity
- Stone weight
- Item code

## ⚡ Quick Troubleshooting

### Image Upload Issues:
**Problem**: Can't upload image
- **Solution**: Ensure file is an image (JPG, PNG, etc.)

### Extraction Failed:
**Problem**: AI couldn't read tag
- **Solution**: 
  1. Retake photos with better lighting
  2. Ensure tag text is clear and focused
  3. Try manual entry instead

### Missing Data:
**Problem**: Some fields empty after scan
- **Solution**: 
  1. This is normal if tag doesn't have all info
  2. Fill missing fields manually
  3. Proceed with calculation

### API Error:
**Problem**: "Extraction failed" message
- **Solution**:
  1. Check internet connection
  2. Verify API key in `.env` file
  3. Ensure API key is active

## 🎓 Example Workflow

```
1. User: "I have a gold necklace tag to scan"
   → Clicks "Scan Jewelry Tag"

2. Scanner: Opens modal → Step 1
   → User selects "Gold"

3. Scanner: → Step 2
   → User uploads 2 photos
   → AI extracts: 15.5g, 22K, Item: GN-1234

4. Scanner: → Step 3
   → User answers: Yes to buy-back, Yes to raw form

5. Scanner: Closes
   → Calculator form auto-filled:
     - Weight: 15.5
     - Carat: 22K
     - Type: (user selects)
   
6. User: Selects type → Clicks Calculate
   → Gets instant price!
```

## 💡 Pro Tips

1. **Save Time**: Scan first, adjust later
2. **Double Check**: Always review extracted data
3. **Manual Override**: You can edit any field after scanning
4. **Both Sides**: Both images help AI accuracy
5. **Clear Tags**: Clean tags = better extraction

## 🆘 Need Help?

### Common Questions:

**Q: Do I need both images?**
A: Yes, both top and bottom views improve accuracy.

**Q: Can I scan multiple tags?**
A: Currently, one tag at a time. Scan, calculate, then scan next.

**Q: Is my data saved?**
A: Images are processed in real-time and not stored.

**Q: What if extraction is wrong?**
A: You can manually edit any field before calculating.

**Q: Does it work offline?**
A: No, internet required for AI extraction.

## 🎉 Ready to Scan!

You're all set! Start scanning jewelry tags and get instant price calculations.

**First time?** Try it with a clear, well-lit tag photo to see the magic! ✨

---

For detailed documentation, see [JEWELRY_TAG_SCANNER_README.md](./JEWELRY_TAG_SCANNER_README.md)
