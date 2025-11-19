import {
  app,
  Tray,
  nativeImage,
  BrowserWindow,
  ipcMain,
  screen,
  session,
} from "electron";
import * as path from "path";
import Store from "electron-store";
import vakitApi from "./services/vakit-api";
import { DailyPrayerTimes, PrayerTime, NextPrayer } from "./types/prayer-times";
import { defaultLocation, updateIntervals } from "./config/default-config";

// Konum kaydetmek için store
interface StoreSchema {
  location: {
    cityName: string;
    districtName: string;
  };
}

const store = new Store<StoreSchema>({
  defaults: {
    location: {
      cityName: defaultLocation.cityName,
      districtName: defaultLocation.districtName,
    },
  },
});

class VakitlerApp {
  private tray: Tray | null = null;
  private popupWindow: BrowserWindow | null = null;
  private todayPrayers: DailyPrayerTimes | null = null;
  private cityName: string;
  private districtName: string;
  private locationName: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private settingsWindow: BrowserWindow | null = null;

  constructor() {
    const savedLocation = store.get("location");
    this.cityName = savedLocation.cityName;
    this.districtName = savedLocation.districtName;
    this.locationName = `${this.cityName}/${this.districtName}`;
  }

  async initialize() {
    await this.fetchPrayerTimes();
    this.createTray();
    this.createPopupWindow();

    this.updateInterval = setInterval(() => {
      this.fetchPrayerTimes();
    }, updateIntervals.prayerTimes);

    setInterval(() => {
      this.updatePopup();
      this.updateTrayTitle();
    }, 1000);
  }

  async fetchPrayerTimes() {
    try {
      const times = await vakitApi.getTodayPrayerTimes(
        this.cityName,
        this.districtName
      );

      this.todayPrayers = times;
      this.updatePopup();
    } catch (error) {
      this.todayPrayers = null;
      this.updatePopup();
    }
  }

  createTray() {
    try {
      const svgTemplate = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <rect x="7" y="2" width="2" height="12" fill="black"/>
          <rect x="6" y="2" width="4" height="2" fill="black"/>
          <path d="M4 8 Q8 6 12 8 Q8 10 4 8" fill="black"/>
          <circle cx="9" cy="8" r="3" fill="white"/>
        </svg>
      `;

      let icon = nativeImage.createFromDataURL(
        "data:image/svg+xml;base64," +
          Buffer.from(svgTemplate).toString("base64")
      );
      icon.setTemplateImage(true);

      this.tray = new Tray(icon);
      this.tray.setToolTip("Vakitler");
      this.tray.on("click", () => {
        this.togglePopup();
      });
      this.updateTrayTitle();
    } catch (error) {
      // Silent fail
    }
  }

  createPopupWindow() {
    this.popupWindow = new BrowserWindow({
      width: 336,
      height: 616,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false,
        enableBlinkFeatures: "Geolocation",
      },
    });

    this.popupWindow.webContents.session.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        if (permission === "geolocation") {
          callback(true);
        } else {
          callback(false);
        }
      }
    );

    let htmlPath: string;
    if (app.isPackaged) {
      htmlPath = path.join(
        process.resourcesPath,
        "app.asar",
        "dist",
        "renderer",
        "popup.html"
      );
    } else {
      htmlPath = path.join(__dirname, "../src/renderer/popup.html");
    }
    this.popupWindow.loadFile(htmlPath);

    this.popupWindow.webContents.once("did-finish-load", () => {
      this.updatePopup();
    });

    this.popupWindow.on("blur", () => {
      if (this.popupWindow && !this.popupWindow.isDestroyed()) {
        this.popupWindow.hide();
      }
    });

    this.popupWindow.on("closed", () => {
      this.popupWindow = null;
      setTimeout(() => {
        this.createPopupWindow();
      }, 100);
    });
  }

  togglePopup() {
    if (!this.popupWindow || this.popupWindow.isDestroyed()) {
      this.createPopupWindow();
      setTimeout(() => {
        this.showPopup();
      }, 50);
      return;
    }

    if (this.popupWindow.isVisible()) {
      this.popupWindow.hide();
    } else {
      this.showPopup();
    }
  }

  showPopup() {
    if (!this.popupWindow || this.popupWindow.isDestroyed()) {
      return;
    }

    if (this.popupWindow.isVisible()) {
      this.popupWindow.focus();
      return;
    }

    this.positionPopup();
    this.updatePopup();
    this.popupWindow.show();
    this.popupWindow.focus();
    this.popupWindow.webContents.send("popup-opened");
  }

  positionPopup() {
    if (!this.popupWindow || !this.tray) return;

    const bounds = this.tray.getBounds();
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const screenBounds = display.bounds;
    const workArea = display.workArea;

    const popupWidth = 336;
    const popupHeight = 616;

    // Menübar ikonunun merkezinden başlayarak popup'ı konumlandır
    const iconCenterX = bounds.x + bounds.width / 2;

    // Popup'ı ikonun merkezinden sola kaydır (popup genişliğinin yarısı kadar)
    let x = iconCenterX - popupWidth / 2;

    // Ekran sınırlarını kontrol et - workArea kullan
    if (x < workArea.x) {
      x = workArea.x + 8;
    } else if (x + popupWidth > workArea.x + workArea.width) {
      x = workArea.x + workArea.width - popupWidth - 8;
    }

    // macOS'ta menubar yukarıda olduğu için
    // bounds.y genellikle 0'a yakın olur, bounds.height menubar yüksekliği
    // Menubar'ın hemen altında açıl - native gibi yapışık (0 piksel boşluk)
    let y: number;

    if (process.platform === "darwin") {
      // macOS'ta menubar genellikle ekranın en üstündedir
      // bounds.y = 0 civarı, bounds.height = menubar yüksekliği (22-24px)
      y = screenBounds.y + bounds.height;
    } else {
      // Diğer platformlar için
      y = bounds.y + bounds.height;
    }

    this.popupWindow.setPosition(Math.round(x), Math.round(y));
  }

  updatePopup() {
    if (this.popupWindow && !this.popupWindow.isDestroyed()) {
      if (this.todayPrayers) {
        const prayers = this.todayPrayers.Vakit;
        const nextPrayer = vakitApi.getNextPrayer(prayers);

        this.popupWindow.webContents.send("prayer-data", {
          prayers,
          nextPrayer,
          location: {
            city: this.cityName,
            district: this.districtName,
          },
          dates: {
            miladi: this.todayPrayers.MiladiTarihUzun,
            hicri: this.todayPrayers.HicriTarihUzun,
          },
        });
      }
    }
    this.updateTrayTitle();
  }

  updateTrayTitle() {
    if (!this.tray || !this.todayPrayers) {
      this.tray?.setTitle("");
      return;
    }

    const prayers = this.todayPrayers.Vakit;
    const nextPrayer = vakitApi.getNextPrayer(prayers);

    if (!nextPrayer) {
      this.tray.setTitle("");
      return;
    }

    const hours = Math.floor(nextPrayer.remainingMinutes / 60);
    const mins = nextPrayer.remainingMinutes % 60;

    // Kısa isimler
    const prayerNameShort: { [key: string]: string } = {
      İmsak: "İmsak",
      Güneş: "Güneş",
      Öğle: "Öğle",
      İkindi: "İkindi",
      Akşam: "Akşam",
      Yatsı: "Yatsı",
    };

    const prayerName = prayerNameShort[nextPrayer.name] || nextPrayer.name;

    let timeStr = "";
    if (hours > 0) {
      timeStr = `${hours}:${mins.toString().padStart(2, "0")}`;
    } else if (mins > 5) {
      timeStr = `${mins}dk`;
    } else if (mins > 0) {
      const secs = nextPrayer.remainingSeconds % 60;
      timeStr = `${mins}dk ${secs}sn`;
    } else {
      timeStr = "şimdi";
    }

    this.tray.setTitle(`${timeStr} → ${prayerName}`);
  }

  openSettings() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 380,
      height: 320,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      title: "Konum Ayarları",
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableBlinkFeatures: "Geolocation",
      },
    });

    this.settingsWindow.webContents.session.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        if (permission === "geolocation") {
          callback(true);
        } else {
          callback(false);
        }
      }
    );

    let htmlPath: string;
    if (app.isPackaged) {
      htmlPath = path.join(
        process.resourcesPath,
        "app.asar",
        "dist",
        "renderer",
        "settings.html"
      );
    } else {
      htmlPath = path.join(__dirname, "../src/renderer/settings.html");
    }
    this.settingsWindow.loadFile(htmlPath);

    this.settingsWindow.on("closed", () => {
      this.settingsWindow = null;
    });
  }

  updateLocation(city: string, district: string) {
    this.cityName = city;
    this.districtName = district;
    this.locationName = `${city}/${district}`;

    store.set("location", { cityName: city, districtName: district });
    this.fetchPrayerTimes();
    this.updatePopup();
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.popupWindow && !this.popupWindow.isDestroyed()) {
      this.popupWindow.close();
    }
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }
}

const vakitlerApp = new VakitlerApp();

if (process.platform === "darwin") {
  app.dock?.hide();
}
ipcMain.on("get-current-location", (event) => {
  event.reply("current-location", {
    city: vakitlerApp["cityName"],
    district: vakitlerApp["districtName"],
  });
});

ipcMain.on("load-cities", async (event) => {
  try {
    const cities = await vakitApi.getCities();
    event.reply("cities-loaded", cities);
  } catch (error: any) {
    event.reply("cities-error", error.message);
  }
});

ipcMain.on("load-districts", async (event, city: string) => {
  try {
    const districts = await vakitApi.getDistricts(city);
    event.reply("districts-loaded", districts);
  } catch (error: any) {
    event.reply("districts-error", error.message);
  }
});

ipcMain.on(
  "save-location",
  (event, location: { city: string; district: string }) => {
    vakitlerApp.updateLocation(location.city, location.district);
    event.reply("location-saved");
  }
);

ipcMain.on("get-prayer-data", (event) => {
  if (vakitlerApp["todayPrayers"]) {
    const prayers = vakitlerApp["todayPrayers"].Vakit;
    const nextPrayer = vakitApi.getNextPrayer(prayers);

    event.reply("prayer-data", {
      prayers,
      nextPrayer,
      location: {
        city: vakitlerApp["cityName"],
        district: vakitlerApp["districtName"],
      },
      dates: {
        miladi: vakitlerApp["todayPrayers"].MiladiTarihUzun,
        hicri: vakitlerApp["todayPrayers"].HicriTarihUzun,
      },
    });
  }
});

ipcMain.on("open-settings-from-popup", () => {
  vakitlerApp.openSettings();
});

ipcMain.on("refresh-prayers", () => {
  vakitlerApp.fetchPrayerTimes();
});

ipcMain.on("quit-app", () => {
  app.quit();
});

ipcMain.on("close-popup", () => {
  if (vakitlerApp["popupWindow"] && !vakitlerApp["popupWindow"].isDestroyed()) {
    vakitlerApp["popupWindow"].hide();
  }
});

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      if (permission === "geolocation") {
        callback(true);
      } else {
        callback(false);
      }
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      if (permission === "geolocation") {
        return true;
      }
      return false;
    }
  );

  vakitlerApp.initialize().catch(() => {
    // Silent fail
  });
});

app.on("window-all-closed", (e: Event) => {
  e.preventDefault();
});

app.on("before-quit", () => {
  vakitlerApp.cleanup();
});

app.on("activate", () => {
  // No-op
});
