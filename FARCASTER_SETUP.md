# Farcaster Mini App - Setup & Fixes Applied

## ✅ Perubahan yang Dilakukan

### 1. **Metadata & Embed (app/layout.tsx)**

**Perbaikan:**
- ✅ Gunakan `fc:miniapp` sebagai primary meta tag (new standard)
- ✅ Pertahankan `fc:frame` untuk backward compatibility
- ✅ Hapus redundant meta tags di `<head>` (sudah ada di metadata.other)
- ✅ Tambahkan `preconnect` untuk performance optimization
- ✅ Struktur miniappEmbed sesuai Farcaster spec

**Format yang Benar:**
```typescript
other: {
  'fc:miniapp': miniappJson,  // Primary untuk Mini Apps baru
  'fc:frame': frameJson,       // Backward compatibility
}
```

**Catatan Penting:**
- `fc:frame` dengan nilai `vNext` adalah LEGACY, tidak digunakan lagi
- Untuk Mini Apps baru, `fc:miniapp` adalah standard
- Embedded JSON harus valid sesuai spec

### 2. **Auto-Connect Logic (lib/farcaster.tsx)**

**Perbaikan:**
- ✅ Better error handling dengan try-catch-finally
- ✅ Logging yang lebih informatif dengan emoji icons
- ✅ Guard check untuk connectorToUse sebelum connect
- ✅ Warning jika no connector available

**Flow Auto-Connect:**
1. Check SDK context → determine if Mini App
2. If in Mini App + not connected → start auto-connect
3. Use first connector (farcasterMiniApp from wagmi.ts)
4. Connect with proper error handling
5. Call `sdk.actions.ready()` to dismiss splash screen

### 3. **Wagmi Configuration (lib/wagmi.ts)**

**Sudah Benar:**
- ✅ `farcasterMiniApp()` connector di posisi pertama
- ✅ Fallback ke injected dan coinbaseWallet
- ✅ Support chains: Base (8453) & Celo (42220)

### 4. **Manifest File (public/.well-known/farcaster.json)**

**Dibuat Baru:**
- ✅ File di lokasi yang benar: `/.well-known/farcaster.json`
- ✅ Struktur sesuai spec dengan `accountAssociation` dan `miniapp`
- ✅ Required chains: Base & Celo
- ✅ Required capabilities: signIn & wallet provider

**⚠️ ACTION REQUIRED:**
File `accountAssociation` masih kosong. Anda perlu:
1. Buka https://farcaster.xyz/~/developers/mini-apps/manifest
2. Masukkan domain: `reda-hoarse-refinedly.ngrok-free.dev`
3. Sign dengan Farcaster account
4. Copy hasil signature ke file farcaster.json

### 5. **Next.js Configuration (next.config.js)**

**Sudah Ditambahkan:**
- ✅ CORS headers untuk iframe embedding
- ✅ Content-Security-Policy: `frame-ancestors *`
- ✅ SVG loader dengan @svgr/webpack
- ✅ allowedDevOrigins untuk ngrok

## 📋 Testing Checklist

### Local Testing (Development):

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Check Console Logs:**
   - `🟣 Farcaster Mini App SDK loaded`
   - `🔌 Auto-connecting with: [connector name]`
   - `✅ Auto-connected wallet successfully`
   - `✅ Mini App ready signal sent`

3. **Test di Preview Tool:**
   - Buka: https://farcaster.xyz/~/developers/mini-apps/preview
   - URL: `https://reda-hoarse-refinedly.ngrok-free.dev`
   - Verify splash screen appears then dismisses
   - Verify VillageDashboard loads

### Production Testing:

1. **Manifest Accessibility:**
   ```bash
   curl https://reda-hoarse-refinedly.ngrok-free.dev/.well-known/farcaster.json
   ```
   Should return valid JSON

2. **Embed Meta Tags:**
   ```bash
   curl https://reda-hoarse-refinedly.ngrok-free.dev | grep "fc:miniapp"
   ```
   Should find the meta tag

3. **Share Test:**
   - Share URL di Farcaster
   - Verify embed card appears
   - Click button → app should open

## 🔧 Common Issues & Solutions

### Issue: "Embed not found"

**Penyebab:**
- Meta tags tidak ada di HTML
- Manifest tidak accessible
- URL tidak match dengan domain di manifest

**Solusi:**
1. Check `curl` output untuk meta tags
2. Verify manifest di `/.well-known/farcaster.json`
3. Ensure APP_URL match dengan actual domain

### Issue: "Wallet not auto-connecting"

**Penyebab:**
- farcasterMiniApp connector tidak di posisi pertama
- SDK context belum loaded
- Network issues

**Solusi:**
1. Check console untuk error messages
2. Verify wagmi config connector order
3. Test dengan different network

### Issue: "Infinite splash screen"

**Penyebab:**
- `sdk.actions.ready()` tidak dipanggil
- Error di initialization

**Solusi:**
1. Check console untuk errors
2. Verify `ready()` dipanggil di farcaster.tsx
3. Add timeout sebagai fallback

## 📚 Key Farcaster Concepts

### Manifest vs Embed

- **Manifest** (`/.well-known/farcaster.json`):
  - One per domain
  - App identity & configuration
  - Required for app registration, notifications, discovery
  
- **Embed** (`fc:miniapp` meta tag):
  - One per shareable page
  - Social sharing metadata
  - Makes pages appear as rich cards in feeds

### Auto-Connect Flow

```
User opens Mini App
    ↓
SDK detects context
    ↓
farcasterMiniApp connector available
    ↓
Auto-connect wallet
    ↓
Call ready() → dismiss splash
    ↓
Show VillageDashboard
```

## 🎯 Next Steps

1. **Sign Manifest:**
   - Go to Farcaster manifest tool
   - Sign with your account
   - Update farcaster.json

2. **Deploy to Production:**
   - Use stable domain (not ngrok)
   - Update APP_URL to production URL
   - Re-sign manifest for production domain

3. **Test Full Flow:**
   - Share in Farcaster feed
   - Click embed → verify app opens
   - Check wallet auto-connects
   - Test all game features

4. **Enable Notifications (Optional):**
   - Add webhookUrl to manifest
   - Implement webhook handler
   - Test notification flow

## 📖 References

- Farcaster Mini Apps Docs: https://miniapps.farcaster.xyz
- Wagmi Docs: https://wagmi.sh
- Manifest Spec: https://miniapps.farcaster.xyz/docs/specification#manifest
- Embed Spec: https://miniapps.farcaster.xyz/docs/specification#mini-app-embed
