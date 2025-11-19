export interface PrayerTime {
  Imsak: string; // İmsak
  Gunes: string; // Güneş
  Ogle: string; // Öğle
  Ikindi: string; // İkindi
  Aksam: string; // Akşam
  Yatsi: string; // Yatsı
}

export interface DailyPrayerTimes {
  MiladiTarihUzun: string; // Miladi tarih
  HicriTarihUzun: string; // Hicri tarih
  Vakit: PrayerTime; // Namaz vakitleri
}

export interface CountryResponse {
  UlkeID: string;
  UlkeAdi: string;
  UlkeAdiEn: string;
}

export interface CityResponse {
  SehirID: string;
  SehirAdi: string;
  SehirAdiEn: string;
}

export interface DistrictResponse {
  IlceID: string;
  IlceAdi: string;
  IlceAdiEn: string;
}

export interface MonthlyPrayerTimesResponse {
  status: string;
  data: DailyPrayerTimes[];
}

export interface Location {
  countryId: string;
  cityId: string;
  districtId: string;
  countryName: string;
  cityName: string;
  districtName: string;
}

export enum PrayerName {
  IMSAK = "İmsak",
  GUNES = "Güneş",
  OGLE = "Öğle",
  IKINDI = "İkindi",
  AKSAM = "Akşam",
  YATSI = "Yatsı",
}

export interface NextPrayer {
  name: PrayerName;
  time: string;
  remainingMinutes: number;
  remainingSeconds: number;
}
