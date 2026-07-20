# Chrome Extension — Remove TikTok

Kontrol hapus repost / like / favorite dari **dashboard**, sementara request API jalan di tab TikTok yang sudah login.

## Install cepat (disarankan)

### Dari dashboard
1. Klik **Pasang Ekstensi** (unduh zip)
2. Extract zip → double-klik **`INSTALL.bat`**
3. Script menyalin path folder + membuka `chrome://extensions`
4. Aktifkan **Developer mode** → **Load unpacked** → **Ctrl+V** → Enter
5. Hard refresh dashboard → status **Connected**

### Dari repo lokal
```bash
pnpm extension:install
```
Path folder `extension/` tersalin ke clipboard dan `chrome://extensions` terbuka otomatis. Lanjut Load unpacked → Ctrl+V.

## Catatan

- Chrome tidak mengizinkan install unpacked 100% otomatis dari website (batasan keamanan)
- Harus login di tiktok.com di browser yang sama
- Progress tampil di dashboard + panel hitam di TikTok
