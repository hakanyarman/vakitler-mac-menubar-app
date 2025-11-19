const { ipcRenderer } = require("electron");

// DOM elementleri
const locationText = document.getElementById("locationText");
const dateText = document.getElementById("dateText");
const nextPrayerName = document.getElementById("nextPrayerName");
const nextPrayerTime = document.getElementById("nextPrayerTime");
const nextPrayerRemaining = document.getElementById("nextPrayerRemaining");
const prayerList = document.getElementById("prayerList");
const locationBtn = document.getElementById("locationBtn");
const refreshBtn = document.getElementById("refreshBtn");
const refreshIcon = document.getElementById("refreshIcon");
const refreshText = document.getElementById("refreshText");
const settingsBtn = document.getElementById("settingsBtn");
const quitBtn = document.getElementById("quitBtn");

// Vakitleri yükle
function loadPrayerData() {
  ipcRenderer.send("get-prayer-data");
}

// Vakitleri göster
function renderPrayers(data) {
  if (!data || !data.prayers) {
    console.error("No prayer data received:", data);
    return;
  }

  const { prayers, nextPrayer, location, dates } = data;
  
  if (!prayerList) {
    console.error("prayerList element not found");
    return;
  }

  // Konum - "İstanbul, Fatih" formatında
  locationText.textContent = `${location.city}, ${location.district}`;

  // Tarih
  const miladi = dates.miladi.split(" ").slice(0, 2).join(" ");
  const hicri = dates.hicri.split(" ").slice(0, 2).join(" ");
  dateText.textContent = `${miladi} | ${hicri}`;

  // Bir sonraki vakit
  const nextPrayerCard = document.getElementById("nextPrayerCard");
  if (nextPrayer) {
    nextPrayerName.textContent = nextPrayer.name;
    nextPrayerTime.textContent = nextPrayer.time;

    // Kalan süreye göre animasyon
    const remainingMinutes = nextPrayer.remainingMinutes;

    // Önceki class'ları temizle
    nextPrayerCard.classList.remove("urgent");

    if (remainingMinutes > 0) {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      const secs = nextPrayer.remainingSeconds % 60;

      let timeStr = "";
      if (remainingMinutes <= 5) {
        // 5 dakikadan az kaldıysa saniye göster
        if (hours > 0) {
          timeStr = `Kalan Süre: ${hours}s ${mins}dk ${secs}sn`;
        } else {
          timeStr = `Kalan Süre: ${mins}dk ${secs}sn`;
        }
      } else {
        // 5 dakikadan fazla kaldıysa sadece saat:dakika
        timeStr =
          hours > 0
            ? `Kalan Süre: ${hours}s ${mins}dk`
            : `Kalan Süre: ${mins}dk`;
      }
      nextPrayerRemaining.textContent = timeStr;

      // 5 dakikadan az kaldıysa urgent
      if (remainingMinutes <= 5) {
        nextPrayerCard.classList.add("urgent");
      } else {
        nextPrayerCard.classList.remove("urgent");
      }
    } else {
      nextPrayerRemaining.textContent = "Şimdi";
      nextPrayerCard.classList.add("urgent");
    }
  }

  // Vakit listesi
  const prayerListItems = [
    { name: "İmsak", time: prayers.Imsak },
    { name: "Güneş", time: prayers.Gunes },
    { name: "Öğle", time: prayers.Ogle },
    { name: "İkindi", time: prayers.Ikindi },
    { name: "Akşam", time: prayers.Aksam },
    { name: "Yatsı", time: prayers.Yatsi },
  ];

  prayerList.innerHTML = prayerListItems
    .map((prayer) => {
      const isActive = nextPrayer && nextPrayer.name === prayer.name;
      const isUrgent =
        isActive && nextPrayer && nextPrayer.remainingMinutes <= 5;
      const activeClass = isActive
        ? isUrgent
          ? "active urgent"
          : "active"
        : "";
      return `
      <div class="prayer-item ${activeClass}">
        <div class="prayer-name">${prayer.name}</div>
        <div class="prayer-time">${prayer.time}</div>
      </div>
    `;
    })
    .join("");
}

// Event listeners
locationBtn.addEventListener("click", () => {
  ipcRenderer.send("open-settings-from-popup");
});

refreshBtn.addEventListener("click", () => {
  // Loading state'i aktif et
  setRefreshLoading(true);

  ipcRenderer.send("refresh-prayers");

  // Kısa bir delay sonra yeniden yükle
  setTimeout(() => {
    loadPrayerData();
  }, 500);
});

// Loading state yönetimi
function setRefreshLoading(isLoading) {
  if (isLoading) {
    refreshBtn.classList.add("loading");
    refreshIcon.innerHTML = '<span class="spinner"></span>';
    refreshText.textContent = "Yenileniyor...";
  } else {
    refreshBtn.classList.remove("loading");
    refreshIcon.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>';
    refreshText.textContent = "Yenile";
  }
}

settingsBtn.addEventListener("click", () => {
  ipcRenderer.send("open-settings-from-popup");
});

quitBtn.addEventListener("click", () => {
  ipcRenderer.send("quit-app");
});

// IPC listeners
ipcRenderer.on("prayer-data", (event, data) => {
  renderPrayers(data);
  // Loading state'i kapat
  setRefreshLoading(false);
});

// İlk yükleme
loadPrayerData();

// Popup açıldığında focus'u ayarla
ipcRenderer.on("popup-opened", () => {
  setTimeout(() => {
    updateFocusableElements();
    if (focusableElements.length > 0) {
      focusElement(0);
    }
  }, 50);
});

// Klavye navigasyonu
let focusableElements = [];
let currentFocusIndex = -1;

function updateFocusableElements() {
  focusableElements = [locationBtn, refreshBtn, settingsBtn, quitBtn].filter(
    (el) => el && !el.classList.contains("loading")
  );
}

function focusElement(index) {
  if (index < 0 || index >= focusableElements.length) return;

  // Önceki focus'u kaldır
  focusableElements.forEach((el) => el.blur());

  // Yeni focus'u ayarla
  currentFocusIndex = index;
  focusableElements[index].focus();
}

function handleKeyboardNavigation(e) {
  updateFocusableElements();

  if (focusableElements.length === 0) return;

  // Tab ile ileri git
  if (e.key === "Tab" && !e.shiftKey) {
    e.preventDefault();
    const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
    focusElement(nextIndex);
  }

  // Shift+Tab ile geri git
  else if (e.key === "Tab" && e.shiftKey) {
    e.preventDefault();
    const prevIndex =
      currentFocusIndex <= 0
        ? focusableElements.length - 1
        : currentFocusIndex - 1;
    focusElement(prevIndex);
  }

  // Enter ile aktif elementi tıkla
  else if (e.key === "Enter" && currentFocusIndex >= 0) {
    e.preventDefault();
    const activeElement = focusableElements[currentFocusIndex];
    if (activeElement) {
      activeElement.click();
    }
  }

  // Escape ile popup'ı kapat
  else if (e.key === "Escape") {
    e.preventDefault();
    ipcRenderer.send("close-popup");
  }
}

// Klavye event listener
document.addEventListener("keydown", handleKeyboardNavigation);

// Her saniye güncelle (kalan süre için - saniye gösterimi için)
setInterval(() => {
  loadPrayerData();
}, 1000);
