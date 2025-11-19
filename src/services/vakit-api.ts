import axios, { AxiosInstance } from "axios";
import {
  DailyPrayerTimes,
  PrayerTime,
  NextPrayer,
  PrayerName,
} from "../types/prayer-times";

/**
 * Vakit API Servisi
 * API Dokümantasyon: https://vakit.vercel.app
 *
 * Ücretsiz, reklamsız, açık kaynak Türkçe namaz vakitleri API'si
 */
export class VakitApiService {
  private api: AxiosInstance;
  private baseUrl: string = "https://vakit.vercel.app";

  constructor() {
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Türkiye'deki tüm şehirleri listeler
   */
  async getCities(): Promise<string[]> {
    try {
      const response = await this.api.get<string[]>("/api/regions", {
        params: { country: "Turkey" },
      });
      return response.data;
    } catch (error) {
      throw new Error("Şehirler yüklenemedi");
    }
  }

  /**
   * Belirli bir şehrin ilçelerini listeler
   * @param city - Şehir adı (örn: İstanbul)
   */
  async getDistricts(city: string): Promise<string[]> {
    try {
      const response = await this.api.get<string[]>("/api/cities", {
        params: {
          country: "Turkey",
          region: city,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error("İlçeler yüklenemedi");
    }
  }

  /**
   * Şehir ve ilçe için koordinatları getirir
   * @param city - Şehir adı
   * @param district - İlçe adı
   */
  async getCoordinates(
    city: string,
    district: string
  ): Promise<{
    latitude: number;
    longitude: number;
  }> {
    try {
      const response = await this.api.get("/api/coordinates", {
        params: {
          country: "Turkey",
          region: city,
          city: district,
        },
      });
      return {
        latitude: response.data.latitude,
        longitude: response.data.longitude,
      };
    } catch (error) {
      throw new Error("Koordinatlar yüklenemedi");
    }
  }

  /**
   * Belirli bir şehir ve ilçe için bugünün namaz vakitlerini getirir
   * @param city - Şehir adı (örn: İstanbul)
   * @param district - İlçe adı (örn: Fatih)
   */
  async getTodayPrayerTimes(
    city: string,
    district: string
  ): Promise<DailyPrayerTimes | null> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const timezoneOffset = -today.getTimezoneOffset(); // JavaScript offset tersine çalışır

      const response = await this.api.get("/api/timesFromPlace", {
        params: {
          country: "Turkey",
          region: city,
          city: district,
          date: dateStr,
          days: 1,
          timezoneOffset: timezoneOffset,
          calculationMethod: "Turkey",
        },
      });

      // Response formatı: { place: {...}, times: { "2025-11-18": ["06:03", ...] } }
      const timesData = response.data.times;
      const todayTimes = timesData[dateStr];

      if (!todayTimes || !Array.isArray(todayTimes) || todayTimes.length < 6) {
        return null;
      }

      // Array sırası: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı
      const [imsak, gunes, ogle, ikindi, aksam, yatsi] = todayTimes;

      // Hicri tarihi yaklaşık hesapla
      const hijriYear = today.getFullYear() - 579;
      const hijriMonths = [
        "Muharrem",
        "Safer",
        "Rebiülevvel",
        "Rebiülahir",
        "Cemaziyelevvel",
        "Cemaziyelahir",
        "Recep",
        "Şaban",
        "Ramazan",
        "Şevval",
        "Zilkade",
        "Zilhicce",
      ];
      const hijriDate = `${today.getDate()} ${
        hijriMonths[today.getMonth()]
      } ${hijriYear}`;

      // Türkçe tarih formatı
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      };
      const miladiDate = today.toLocaleDateString("tr-TR", options);

      return {
        MiladiTarihUzun: miladiDate,
        HicriTarihUzun: hijriDate,
        Vakit: {
          Imsak: imsak,
          Gunes: gunes,
          Ogle: ogle,
          Ikindi: ikindi,
          Aksam: aksam,
          Yatsi: yatsi,
        },
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * GPS koordinatlarından bugünün namaz vakitlerini getirir
   * @param latitude - Enlem
   * @param longitude - Boylam
   */
  async getTodayPrayerTimesFromGPS(
    latitude: number,
    longitude: number
  ): Promise<DailyPrayerTimes | null> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const timezoneOffset = -today.getTimezoneOffset();

      const response = await this.api.get("/api/timesForGPS", {
        params: {
          lat: latitude,
          lng: longitude,
          date: dateStr,
          days: 1,
          timezoneOffset: timezoneOffset,
          calculationMethod: "Turkey",
        },
      });

      // Response formatı kontrolü
      const timesData = response.data.times || response.data;
      const todayTimes = timesData[dateStr] || timesData;

      if (!todayTimes || !Array.isArray(todayTimes) || todayTimes.length < 6) {
        return null;
      }

      // Array sırası: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı
      const [imsak, gunes, ogle, ikindi, aksam, yatsi] = todayTimes;

      // Hicri tarihi yaklaşık hesapla
      const hijriYear = today.getFullYear() - 579;
      const hijriMonths = [
        "Muharrem",
        "Safer",
        "Rebiülevvel",
        "Rebiülahir",
        "Cemaziyelevvel",
        "Cemaziyelahir",
        "Recep",
        "Şaban",
        "Ramazan",
        "Şevval",
        "Zilkade",
        "Zilhicce",
      ];
      const hijriDate = `${today.getDate()} ${
        hijriMonths[today.getMonth()]
      } ${hijriYear}`;

      // Türkçe tarih formatı
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      };
      const miladiDate = today.toLocaleDateString("tr-TR", options);

      return {
        MiladiTarihUzun: miladiDate,
        HicriTarihUzun: hijriDate,
        Vakit: {
          Imsak: imsak,
          Gunes: gunes,
          Ogle: ogle,
          Ikindi: ikindi,
          Aksam: aksam,
          Yatsi: yatsi,
        },
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Bir sonraki namaz vaktini hesaplar
   * @param prayerTimes - Günlük namaz vakitleri
   */
  getNextPrayer(prayerTimes: PrayerTime): NextPrayer | null {
    const now = new Date();
    const currentTimeInSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const prayers = [
      { name: PrayerName.IMSAK, time: prayerTimes.Imsak },
      { name: PrayerName.GUNES, time: prayerTimes.Gunes },
      { name: PrayerName.OGLE, time: prayerTimes.Ogle },
      { name: PrayerName.IKINDI, time: prayerTimes.Ikindi },
      { name: PrayerName.AKSAM, time: prayerTimes.Aksam },
      { name: PrayerName.YATSI, time: prayerTimes.Yatsi },
    ];

    // Her vakit için saniye cinsinden değer hesapla
    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(":").map(Number);
      const prayerTimeInSeconds = hours * 3600 + minutes * 60;

      if (prayerTimeInSeconds > currentTimeInSeconds) {
        const remainingSeconds = prayerTimeInSeconds - currentTimeInSeconds;
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        return {
          name: prayer.name,
          time: prayer.time,
          remainingMinutes,
          remainingSeconds,
        };
      }
    }

    // Eğer tüm vakitler geçtiyse, yarının ilk vakti (İmsak)
    const [hours, minutes] = prayerTimes.Imsak.split(":").map(Number);
    const imsakSeconds = hours * 3600 + minutes * 60;
    const remainingUntilMidnight = 24 * 3600 - currentTimeInSeconds;
    const remainingSeconds = remainingUntilMidnight + imsakSeconds;
    const remainingMinutes = Math.floor(remainingSeconds / 60);

    return {
      name: PrayerName.IMSAK,
      time: prayerTimes.Imsak,
      remainingMinutes,
      remainingSeconds,
    };
  }

  /**
   * Konum araması yapar
   * @param query - Aranacak metin
   */
  async searchPlaces(query: string): Promise<any[]> {
    try {
      const response = await this.api.get("/api/searchPlaces", {
        params: {
          q: query,
          lang: "tr",
        },
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }
}

export default new VakitApiService();
