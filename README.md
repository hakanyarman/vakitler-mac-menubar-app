# Vakitler Menubar App

<div align="center">
  <img src="assets/icon.svg" alt="Vakitler Icon" width="128" height="128">
  <p><em>macOS menübar'da çalışan Türkçe namaz vakitleri uygulaması</em></p>
</div>

## ✨ Özellikler

- 📿 Günlük namaz vakitlerini gösterir (İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı)
- ⏰ Bir sonraki namaz vaktine kalan süreyi canlı olarak gösterir
- 🔄 Otomatik güncelleme (30 dakikada bir)
- 🎯 Hafif ve kullanımı kolay menübar uygulaması
- 📍 Türkiye'nin tüm il ve ilçeleri için konum seçimi

## 📥 Kurulum

### Kullanıcılar için

1. [Releases](https://github.com/kullaniciadi/vakitler-menubar-app/releases) sayfasından en son DMG dosyasını indirin
2. DMG dosyasını açın
3. Uygulamayı Applications klasörüne sürükleyin
4. İlk açılışta güvenlik uyarısı alabilirsiniz:
   - System Settings > Privacy & Security bölümünden "Open Anyway" seçeneğini kullanın

### Geliştiriciler için

```bash
# Bağımlılıkları yükleyin
npm install

# TypeScript dosyalarını derleyin
npm run build

# Renderer dosyalarını kopyalayın
cp src/renderer/*.{js,html} dist/renderer/

# Uygulamayı çalıştırın
npm start

# Build alın (DMG + ZIP)
npm run package
```

## 🎯 Kullanım

1. Uygulama başladığında menübar'da (saat yanında) görünür
2. İkona tıklayarak namaz vakitlerini görüntüleyin
3. Bir sonraki namaz vaktine kalan süre otomatik hesaplanır
4. "Konum Ayarları" ile şehir ve ilçe seçebilirsiniz
5. "Yenile" butonu ile vakitleri manuel güncelleyebilirsiniz

## 📍 Konum Ayarları

Varsayılan olarak **İstanbul/İstanbul** için namaz vakitleri gösterilir.

Kendi konumunuzu ayarlamak için:

1. Menübar ikonuna tıklayın
2. "Konum Ayarları" butonuna tıklayın
3. Şehir adını yazmaya başlayın (arama otomatik çalışır)
4. Şehir seçtikten sonra ilçe seçin
5. "Kaydet" butonuna tıklayın

> Türkiye'nin 81 ili ve tüm ilçeleri kullanılabilir.

## 🛠 Teknolojiler

- [Electron](https://www.electronjs.org/) - macOS menübar uygulaması
- [TypeScript](https://www.typescriptlang.org/) - Tip güvenli geliştirme
- [Axios](https://axios-http.com/) - HTTP istekleri
- [electron-store](https://github.com/sindresorhus/electron-store) - Konum ayarlarını kaydetme
- [Vakit API](https://vakit.vercel.app) - Namaz vakitleri API'si

## 🌐 API ve Veri Kaynağı

Uygulama [Vakit API](https://vakit.vercel.app) kullanıyor:

✅ Diyanet İşleri Başkanlığı standartlarına uygun  
✅ Türkiye'nin tüm il ve ilçeleri  
✅ Gerçek zamanlı güncel vakitler  
✅ Ücretsiz ve açık kaynak  
✅ API key gerektirmez

## 📁 Proje Yapısı

```
vakitler-menubar-app/
├── src/
│   ├── main.ts                      # Ana Electron process
│   ├── services/
│   │   └── vakit-api.ts            # Vakit API servisi
│   ├── types/
│   │   └── prayer-times.ts         # TypeScript tip tanımları
│   ├── config/
│   │   └── default-config.ts       # Varsayılan konum ayarları
│   └── renderer/
│       ├── popup.html              # Popup pencere
│       ├── popup-renderer.js       # Popup logic
│       ├── settings.html           # Ayarlar penceresi
│       └── settings-renderer.js    # Ayarlar logic
├── assets/
│   └── icon.icns                   # macOS app icon
├── dist/                            # Build çıktıları
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Geliştirme

### Debug Modu

```bash
# Watch mode ile TypeScript otomatik derler
npm run watch

# Başka bir terminalde uygulamayı çalıştırın
npm start
```

### Build

```bash
# Sadece TypeScript derle
npm run build

# macOS için paket oluştur
npm run package
```

Build sonrası `dist/` klasöründe şunlar oluşur:

- `Vakitler Menubar App-1.0.0-arm64.dmg` (Apple Silicon)
- `Vakitler Menubar App-1.0.0-arm64-mac.zip` (Apple Silicon)

## 💾 Sistem Gereksinimleri

- macOS 10.13 veya üzeri
- Apple Silicon (M1/M2/M3) veya Intel Mac
- ~225 MB disk alanı

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request açın

## 🙏 Teşekkürler

- [Vakit API](https://vakit.vercel.app) - Namaz vakitleri verisi için
