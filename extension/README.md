# Chrome Extension — Remove Repost TikTok

Kontrol hapus repost dari **dashboard**, sementara request API jalan di tab TikTok yang sudah login (sama andalnya Console).

## Install (sekali)

1. Buka `chrome://extensions`
2. Aktifkan **Developer mode**
3. **Load unpacked** → pilih folder ini (`extension/`)
4. Refresh dashboard app (`http://localhost:3000/dashboard/tiktok`)
5. Status harus **Connected**, lalu **Start Hapus Repost**

## Catatan

- Harus login di tiktok.com di browser yang sama
- Progress tampil di dashboard + panel hitam di TikTok
- Fallback tetap ada: Script Console di dashboard
