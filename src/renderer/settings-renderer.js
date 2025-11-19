/**
 * Ayarlar Penceresi Renderer Process
 * Kullanıcının şehir ve ilçe seçmesini sağlar
 */

// Electron IPC
const { ipcRenderer } = require("electron");

// State
let cities = [];
let districts = [];
let selectedCity = "";
let selectedDistrict = "";
let currentKeyboardIndex = -1;

// DOM Elements
const cityInput = document.getElementById("cityInput");
const districtInput = document.getElementById("districtInput");
const cityResults = document.getElementById("cityResults");
const districtResults = document.getElementById("districtResults");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const locationForm = document.getElementById("locationForm");
const errorEl = document.getElementById("error");

// Mevcut konumu al
ipcRenderer.send("get-current-location");

ipcRenderer.on("current-location", (_event, location) => {
  selectedCity = location.city;
  selectedDistrict = location.district;
});

// Şehirleri yükle
ipcRenderer.send("load-cities");

ipcRenderer.on("cities-loaded", (_event, loadedCities) => {
  cities = loadedCities;
});

ipcRenderer.on("cities-error", (_event, error) => {
  showError("Şehirler yüklenemedi: " + error);
});

// Şehir input - arama
cityInput.addEventListener("input", () => {
  const query = cityInput.value.trim().toLowerCase();

  if (query.length < 1) {
    cityResults.classList.remove("show");
    cityResults.innerHTML = "";
    return;
  }

  // Türkçe karakter desteği ile arama
  const filtered = cities.filter((city) =>
    turkishToLower(city).includes(query)
  );

  displayResults(filtered, cityResults, (city) => {
    cityInput.value = city;
    selectedCity = city;
    cityResults.classList.remove("show");

    // İlçeleri yükle
    loadDistricts(city);
  });
});

// Şehir input - klavye navigasyonu
cityInput.addEventListener("keydown", (e) => {
  handleKeyboardNavigation(e, cityResults, (selectedText) => {
    cityInput.value = selectedText;
    selectedCity = selectedText;
    cityResults.classList.remove("show");
    loadDistricts(selectedText);
  });
});

// İlçe input - arama
districtInput.addEventListener("input", () => {
  const query = districtInput.value.trim().toLowerCase();

  if (query.length < 1) {
    districtResults.classList.remove("show");
    districtResults.innerHTML = "";
    return;
  }

  const filtered = districts.filter((district) =>
    turkishToLower(district).includes(query)
  );

  displayResults(filtered, districtResults, (district) => {
    districtInput.value = district;
    selectedDistrict = district;
    districtResults.classList.remove("show");
    updateSaveButton();
  });
});

// İlçe input - klavye navigasyonu
districtInput.addEventListener("keydown", (e) => {
  handleKeyboardNavigation(e, districtResults, (selectedText) => {
    districtInput.value = selectedText;
    selectedDistrict = selectedText;
    districtResults.classList.remove("show");
    updateSaveButton();
  });
});

// İlçeleri yükle
function loadDistricts(city) {
  districtInput.value = "";
  districtInput.disabled = true;
  districtInput.placeholder = "İlçeler yükleniyor...";
  districts = [];
  selectedDistrict = "";
  updateSaveButton();

  ipcRenderer.send("load-districts", city);
}

ipcRenderer.on("districts-loaded", (_event, loadedDistricts) => {
  districts = loadedDistricts;
  districtInput.disabled = false;
  districtInput.placeholder = "İlçe adı yazın";
  districtInput.focus();
});

ipcRenderer.on("districts-error", (_event, error) => {
  districtInput.disabled = false;
  districtInput.placeholder = "İlçe yüklenemedi";
  showError("İlçeler yüklenemedi: " + error);
});

// Sonuçları göster
function displayResults(items, container, onSelect) {
  currentKeyboardIndex = -1;

  if (items.length === 0) {
    container.innerHTML =
      '<div class="autocomplete-item" style="color: #999;">Sonuç bulunamadı</div>';
    container.classList.add("show");
    return;
  }

  container.innerHTML = items
    .slice(0, 10) // İlk 10 sonucu göster
    .map(
      (item) =>
        `<div class="autocomplete-item" data-value="${item}">${item}</div>`
    )
    .join("");

  container.classList.add("show");

  // Click event
  container.querySelectorAll(".autocomplete-item").forEach((el) => {
    el.addEventListener("click", () => {
      onSelect(el.getAttribute("data-value"));
    });
  });
}

// Klavye navigasyonu
function handleKeyboardNavigation(e, container, onSelect) {
  const items = container.querySelectorAll(".autocomplete-item");

  if (items.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    currentKeyboardIndex = Math.min(currentKeyboardIndex + 1, items.length - 1);
    updateKeyboardSelection(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    currentKeyboardIndex = Math.max(currentKeyboardIndex - 1, -1);
    updateKeyboardSelection(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentKeyboardIndex >= 0) {
      const selected = items[currentKeyboardIndex];
      onSelect(selected.getAttribute("data-value"));
    }
  } else if (e.key === "Escape") {
    container.classList.remove("show");
    currentKeyboardIndex = -1;
  }
}

function updateKeyboardSelection(items) {
  items.forEach((item, index) => {
    if (index === currentKeyboardIndex) {
      item.classList.add("selected");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("selected");
    }
  });
}

// Kaydet butonu durumu
function updateSaveButton() {
  saveBtn.disabled = !(selectedCity && selectedDistrict);
}

// Form submit
locationForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (selectedCity && selectedDistrict) {
    ipcRenderer.send("save-location", {
      city: selectedCity,
      district: selectedDistrict,
    });
  }
});

ipcRenderer.on("location-saved", () => {
  // Toast göster
  showToast();

  // Kısa bir delay sonra pencereyi kapat
  setTimeout(() => {
    window.close();
  }, 1500);
});

// Toast göster
function showToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.add("show");

  // 1.5 saniye sonra gizle
  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}

// İptal
cancelBtn.addEventListener("click", () => {
  window.close();
});

// Klavye navigasyonu
document.addEventListener("keydown", (e) => {
  // Escape ile pencereyi kapat
  if (e.key === "Escape") {
    e.preventDefault();
    window.close();
  }

  // Enter ile form submit (eğer autocomplete açık değilse)
  if (
    e.key === "Enter" &&
    !cityResults.classList.contains("show") &&
    !districtResults.classList.contains("show")
  ) {
    e.preventDefault();
    if (!saveBtn.disabled) {
      locationForm.dispatchEvent(new Event("submit"));
    }
  }
});

// Hata göster
function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add("show");
  setTimeout(() => {
    errorEl.classList.remove("show");
  }, 5000);
}

// Türkçe karakter normalizasyonu
function turkishToLower(str) {
  return str
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i");
}

// Click outside - sonuçları kapat
document.addEventListener("click", (e) => {
  if (!cityInput.contains(e.target) && !cityResults.contains(e.target)) {
    cityResults.classList.remove("show");
  }
  if (
    !districtInput.contains(e.target) &&
    !districtResults.contains(e.target)
  ) {
    districtResults.classList.remove("show");
  }
});
