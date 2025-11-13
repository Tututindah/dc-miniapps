# 🏰 Cara Menggunakan 3 PNG Assets Anda

## Mapping Asset ke Building Types

Anda punya **3 PNG images**. Kita akan gunakan untuk **5 building types** dengan duplikasi:

### 📦 Image 1: Farm House (Rumah Kayu Cokelat)
**File yang Anda upload:** Rumah kayu dengan atap cokelat dan jendela

**Gunakan untuk 2 buildings:**
1. **`castle.png`** → Collection building (tampilan di Collection room)
2. **`farm.png`** → Hatchery/Farm building (tampilan di Hatchery)

**Cara:**
```
Klik kanan pada gambar rumah kayu → Save As → castle.png
Copy file castle.png → Rename copy menjadi farm.png
```

---

### 🏰 Image 2: Grand Castle (Kastil Megah dengan Menara)
**File yang Anda upload:** Kastil besar dengan banyak menara dan bendera

**Gunakan untuk 2 buildings:**
1. **`fortress.png`** → Battle Arena (tampilan di Battle room)
2. **`tower.png`** → Training Tower (tampilan di Training room)

**Cara:**
```
Klik kanan pada gambar kastil → Save As → fortress.png
Copy file fortress.png → Rename copy menjadi tower.png
```

---

### 🏪 Image 3: Market Shop (Kedai dengan Counter)
**File yang Anda upload:** Kedai kayu dengan area counter/display

**Gunakan untuk 1 building:**
1. **`temple.png`** → Marketplace/Breeding Temple

**Cara:**
```
Klik kanan pada gambar kedai → Save As → temple.png
```

---

## ✅ Checklist

Setelah selesai, folder `public/assets/buildings/` harus berisi:

- [x] `castle.png` (copy dari Image 1 - rumah kayu)
- [x] `farm.png` (copy dari Image 1 - rumah kayu)
- [x] `fortress.png` (copy dari Image 2 - kastil megah)
- [x] `tower.png` (copy dari Image 2 - kastil megah)
- [x] `temple.png` (copy dari Image 3 - kedai)

**Total: 5 files dari 3 gambar asli**

---

## 🚀 Cara Test

1. Simpan semua 5 PNG files di folder ini
2. Buka browser game
3. Tekan **Ctrl + Shift + R** (hard refresh)
4. Cek browser console (F12) untuk melihat:
   ```
   [Texture] ✅ Loaded castle.png (WIDTHxHEIGHT) -> ID 1
   [Texture] ✅ Loaded fortress.png (WIDTHxHEIGHT) -> ID 2
   ...
   ```
5. Jalan ke village area (x=50-80) untuk lihat textured buildings!

---

## 🎨 Asset Mapping Summary

| Building Type | PNG File | Your Image | Village Position |
|--------------|----------|------------|------------------|
| Collection | `castle.png` | 🏠 Farm House | Building 1 |
| Battle Arena | `fortress.png` | 🏰 Grand Castle | Building 2 |
| Hatchery | `farm.png` | 🏠 Farm House | Building 3 |
| Training | `tower.png` | 🏰 Grand Castle | Building 4 |
| Marketplace | `temple.png` | 🏪 Market Shop | Building 5 |

**Jika PNG tidak ditemukan:** Game akan tampilkan colored cube sebagai fallback.
