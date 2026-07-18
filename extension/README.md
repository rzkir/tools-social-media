# Chrome Extension — Remove Repost TikTok

Kontrol hapus repost dari **dashboard**, sementara request API jalan di tab TikTok yang sudah login (sama andalnya Console).

## Install (sekali)

1. Buka **Google Chrome** atau **Edge** (bukan preview Cursor)
2. Buka `chrome://extensions` (atau `edge://extensions`)
3. Aktifkan **Developer mode**
4. **Load unpacked** → pilih folder ini **persis**:

   `C:\Users\Administrator\Desktop\remove-repost-tiktok\extension`

   Jangan pilih folder project (`remove-repost-tiktok`) atau `public`.
5. Hard refresh dashboard (`Ctrl+Shift+R`) di `http://localhost:3000/dashboard/tiktok`
6. Status harus **Connected**, lalu **Start Hapus Repost**

Kalau sudah pernah load versi lama: di `chrome://extensions` klik **Remove**, lalu Load unpacked lagi (versi 1.0.2).

## Catatan

- Harus login di tiktok.com di browser yang sama
- Progress tampil di dashboard + panel hitam di TikTok
- Fallback tetap ada: Script Console di dashboard
