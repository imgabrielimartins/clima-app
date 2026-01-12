// 1. CONFIGURAÇÕES E SELEÇÃO DE ELEMENTOS
const CONFIG = {
  BASE_URL: "https://api.open-meteo.com/v1/forecast",
  GEO_URL: "https://geocoding-api.open-meteo.com/v1/search",
  DAYS_MAP: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
};

const el = {
  button: document.getElementById("searchBtn"),
  input: document.getElementById("cityInput"),
  result: document.getElementById("result"),
  toggleDark: document.getElementById("toggleDark"),
  saveBtn: document.getElementById("saveCity"),
  favoritesDiv: document.getElementById("favorites")
};

// 2. UTILITÁRIOS DE INTERFACE (UI)
const UI = {
  getIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 2) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 99) return "⛈️";
    return "🌤️";
  },

  setBgByCode(code) {
    const body = document.body;
    body.classList.remove("sunny", "rainy", "cloudy");
    if (code === 0) body.classList.add("sunny");
    else if (code <= 3) body.classList.add("cloudy");
    else body.classList.add("rainy");
  }
};

// 3. GESTÃO DE DADOS (API)
const DataService = {
  async getWeather(lat, lon, name = "Sua localização") {
    try {
      // Ajuste na URL para pegar umidade e vento atuais + 24h de previsão
      const url = `${CONFIG.BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
      
      const resp = await fetch(url);
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      
      // Organiza os dados atuais para a renderização
      const currentDetails = {
        temperature: data.current.temperature_2m,
        weathercode: data.current.weather_code,
        humidity: data.current.relative_humidity_2m,
        wind: data.current.wind_speed_10m
      };

      renderWeather(name, currentDetails, data.daily, data.hourly);
    } catch (error) {
      el.result.innerHTML = "Erro ao carregar clima.";
      console.error(error);
    }
  },

  async getCoords(city) {
    if (!city) return alert("Digite uma cidade!");
    el.result.innerHTML = "<p class='loading'>Buscando...</p>";
    try {
      const resp = await fetch(`${CONFIG.GEO_URL}?name=${encodeURIComponent(city)}&count=1`);
      const data = await resp.json();
      if (!data.results) return el.result.innerHTML = "Não encontrado.";
      const { latitude, longitude, name } = data.results[0];
      this.getWeather(latitude, longitude, name);
    } catch {
      el.result.innerHTML = "Erro na busca.";
    }
  }
};

// 4. FUNÇÕES DE RENDERIZAÇÃO
function renderWeather(name, current, daily, hourly) {
  const { temperature, weathercode, humidity, wind } = current;
  const now = new Date().getHours();

  // 1. Carrossel por Hora
  let hourlyHTML = `<div class="hourly-forecast">`;
  for (let i = 0; i < 24; i++) {
    const hourLabel = (now + i) % 24;
    hourlyHTML += `
      <div class="hour-item">
        <p>${hourLabel}:00</p>
        <span>${UI.getIcon(hourly.weather_code[i])}</span>
        <strong>${Math.round(hourly.temperature_2m[i])}°</strong>
      </div>`;
  }
  hourlyHTML += `</div>`;

  // 2. Previsão Semanal
  let forecastHTML = `<div class="forecast">`;
  for (let i = 1; i < 7; i++) {
    const [y, m, d] = daily.time[i].split("-").map(Number);
    const dayName = CONFIG.DAYS_MAP[new Date(y, m - 1, d).getDay()];
    forecastHTML += `
      <div class="day">
        <p><strong>${dayName}</strong></p>
        <span class="day-icon">${UI.getIcon(daily.weather_code[i])}</span>
        <p>${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</p>
      </div>`;
  }
  forecastHTML += `</div>`;

  // 3. Montagem do HTML Final
  el.result.innerHTML = `
    <h2>${name}</h2>
    <div class="main-icon">${UI.getIcon(weathercode)}</div>
    <p class="temp">🌡️ ${Math.round(temperature)}°C</p>
    
    <div class="weather-details">
        <div class="detail-item">💧 <span>Umidade</span> <strong>${humidity}%</strong></div>
        <div class="detail-item">💨 <span>Vento</span> <strong>${wind} km/h</strong></div>
    </div>

    <h3 class="section-title">Próximas Horas</h3>
    ${hourlyHTML}

    <h3 class="section-title">Tendência Semanal</h3>
    <div class="chart-container">
        <canvas id="tempChart"></canvas>
    </div>

    <h3 class="section-title">Próximos Dias</h3>
    ${forecastHTML}
  `;
    
  UI.setBgByCode(weathercode);
  createTrendChart(daily);
}

// 5. GRÁFICO (Chart.js)
function createTrendChart(daily) {
  const ctx = document.getElementById('tempChart').getContext('2d');
  if (window.weatherChart) window.weatherChart.destroy();

  window.weatherChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: daily.time.map(t => {
        const [y, m, d] = t.split("-").map(Number);
        return CONFIG.DAYS_MAP[new Date(y, m - 1, d).getDay()];
      }),
      datasets: [{
        data: daily.temperature_2m_max,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { display: false },
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

// 6. AÇÕES E LISTENERS
const Actions = {
  handleSearch: () => DataService.getCoords(el.input.value.trim()),
  
  handleTheme: () => {
    el.toggleDark.classList.add("animate");
    const isDark = !document.body.classList.contains("dark");
    document.body.classList.toggle("dark", isDark);
    setTimeout(() => { el.toggleDark.textContent = isDark ? "☀️" : "🌙"; }, 200);
    setTimeout(() => { el.toggleDark.classList.remove("animate"); }, 500);
  },

  saveFav: () => {
    const city = el.input.value.trim();
    if (!city) return;
    let favs = JSON.parse(localStorage.getItem("cities")) || [];
    if (!favs.some(f => f.toLowerCase() === city.toLowerCase())) {
      favs.push(city);
      localStorage.setItem("cities", JSON.stringify(favs));
      Actions.loadFavs();
    }
  },

  removeFav: (cityToRemove) => {
    let favs = JSON.parse(localStorage.getItem("cities")) || [];
    favs = favs.filter(city => city.toLowerCase() !== cityToRemove.toLowerCase());
    localStorage.setItem("cities", JSON.stringify(favs));
    Actions.loadFavs();
  },

  loadFavs: () => {
    const favs = JSON.parse(localStorage.getItem("cities")) || [];
    el.favoritesDiv.innerHTML = favs.map(c => `
        <div class="fav-wrapper">
            <button class="fav-btn" data-city="${c}">${c}</button>
            <button class="remove-fav" data-remove="${c}">✕</button>
        </div>
      `).join("");
  }
};

el.button.addEventListener("click", Actions.handleSearch);
el.saveBtn.addEventListener("click", Actions.saveFav);
el.toggleDark.addEventListener("click", Actions.handleTheme);
el.input.addEventListener("keypress", (e) => { if (e.key === "Enter") Actions.handleSearch(); });

el.favoritesDiv.addEventListener("click", (e) => {
  if (e.target.dataset.remove) return Actions.removeFav(e.target.dataset.remove);
  if (e.target.dataset.city) DataService.getCoords(e.target.dataset.city);
});

window.addEventListener("load", () => {
  Actions.loadFavs();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (p) => DataService.getWeather(p.coords.latitude, p.coords.longitude),
      () => el.result.innerHTML = "<p>Localização negada.</p>"
    );
  }
});

// Dentro da parte onde você renderiza o clima real
resultSection.innerHTML = `
  <div class="weather-info fade-in">
    <p class="location-label">Sua localização</p>
    <img src="${data.iconUrl}" alt="Clima" class="main-icon">
    <p class="temp">${Math.round(data.main.temp)}°C</p>
    
    <div class="weather-details">
      <div class="detail-item">
        <span>💧</span>
        <span>${data.main.humidity}%</span>
      </div>
      <div class="detail-item">
        <span>💨</span>
        <span>${Math.round(data.wind.speed * 3.6)} km/h</span>
      </div>
    </div>
  </div>
`;

document.getElementById('toggleDark').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

