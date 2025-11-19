/**
 * Varsayılan konum ayarları
 * Kullanıcı kendi şehrini buradan değiştirebilir
 *
 * Not: Vakit API kullanıldığı için artık sadece şehir ve ilçe adı yeterli
 */
export const defaultLocation = {
  cityName: "İstanbul",
  districtName: "İstanbul",
};

/**
 * Güncelleme sıklığı (milisaniye)
 */
export const updateIntervals = {
  prayerTimes: 30 * 60 * 1000, // 30 dakika
  menuRefresh: 60 * 1000, // 1 dakika
};
