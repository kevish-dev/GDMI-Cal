# Quick Start Guide: API-Based Gold Price Management

## 🚀 For Admins

### First Time Setup (One-time)

1. **Login to Admin Dashboard**
   ```
   Navigate to: /admin
   Login with your admin credentials
   ```

2. **Set Your Premium**
   ```
   - Go to "Gold Rates" tab
   - Find "Live Gold Price" card
   - Enter your premium (e.g., 2000) in the Premium field
   - Click "Set" button
   ```

3. **Fetch Live Price**
   ```
   - Click "Fetch Live Price & Update" button
   - Wait for confirmation toast
   - All gold rates are now updated!
   ```

### Daily Usage

**To Update Gold Prices:**
1. Click "Fetch Live Price & Update" button
2. Done! ✓

**To Change Premium:**
1. Enter new premium value
2. Click "Set" button  
3. Rates automatically recalculate ✓

## 📊 Understanding the Pricing

### The Formula:
```
Final 24K Price = Base Price (from API) + Premium (your markup)
```

### Example:
```
API Base Price:  ₹12,205/g  (from MCX)
Your Premium:    ₹2,000/g   (your profit margin)
─────────────────────────────────────
Final 24K:       ₹14,205/g  (what customers see)

Then automatically calculated:
22K: ₹13,012/g  (91.6% of 24K)
18K: ₹10,654/g  (75% of 24K)
14K: ₹8,310/g   (58.5% of 24K)
```

## 🎯 What You See on the Dashboard

### Live Gold Price Card:

```
┌─────────────────────────────────┐
│ 🔼 Live Gold Price              │
├─────────────────────────────────┤
│ Base Price (API): ₹12,205/g     │
│ Premium:          ₹2,000/g      │
│ ─────────────────────────────── │
│ Final 24K Price:  ₹14,205/g     │
│ Expiry: 2025-12-05              │
├─────────────────────────────────┤
│ Premium: [2000      ] [Set]     │
│                                 │
│ [Fetch Live Price & Update]     │
└─────────────────────────────────┘
```

## ✅ Benefits

- ✓ **One-Click Updates**: No manual calculation needed
- ✓ **Always Accurate**: Direct from MCX futures market
- ✓ **Transparent**: See base price vs your premium
- ✓ **Instant Sync**: All users see updates immediately
- ✓ **Full Control**: Adjust premium anytime
- ✓ **Audit Trail**: All changes logged

## 🔧 Troubleshooting

**Q: "Fetch button not working?"**  
A: Check your internet connection and try again

**Q: "Want to change premium?"**  
A: Enter new value and click "Set" - rates recalculate automatically

**Q: "Need to update manually?"**  
A: Use the "Manual Update" card below for direct entry

**Q: "How often should I update?"**  
A: Recommended: 2-3 times daily during market hours

## 📱 For Users (Calculator Page)

Users automatically see the updated rates!

- Real-time sync when admin updates
- No action needed from users
- Calculations always use latest rates
- Premium is included in displayed prices

## 🎓 Pro Tips

1. **Morning Routine**: Fetch prices when market opens (9 AM)
2. **Competitive Premium**: Check competitors before setting
3. **Market Volatility**: Update more frequently on volatile days
4. **Weekend**: Rates stay same, update Monday morning
5. **Special Events**: Adjust premium for festivals/sales

## 📞 Need Help?

- Check: `GOLD_PRICE_API_FLOW.md` for detailed documentation
- Test: Run `bun src/tests/moneycontrol-api.test.ts`
- Legacy: Use "Manual Update" card if API has issues

---

**That's it! Simple, fast, and accurate gold pricing.** 🎉
