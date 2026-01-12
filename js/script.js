const button = document.getElementById("searchBtn");
const input = document.getElementById("cityInput");
const result = document.getElementById("result");
const toggleDark = document.getElementById("toggleDark");

toggleDark.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  toggleDark.classList.add("animate");

  if (document.body.classList.contains("dark")) {
    toggleDark.textContent = "☀️";
  } else {
    toggleDark.textContent = "🌙";
  }

  setTimeout(() => {
    toggleDark.classList.remove("animate");
  }, 400);
});

button.addEventListener("click", () => {
  const city = input.value;
  if (!city) return alert("Digite uma cidade!");
  getWeather(city);
});

async function getWeather(city) {
  try {
    result.innerHTML = "Carregando...";

    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
    );
    const geoData = await geo.json();

    if (!geoData.results) {
      result.innerHTML = "Cidade não encontrada";
      return;
    }

    const { latitude, longitude, name } = geoData.results[0];

    const weather = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    const weatherData = await weather.json();

    const temp = weatherData.current_weather.temperature;
    const code = weatherData.current_weather.weathercode;

    const icon = getWeatherIcon(code);

    result.innerHTML = `
      <h2>${name}</h2>
      <p style="font-size:40px">${icon}</p>
      <p>🌡️ ${temp}°C</p>
    `;
  } catch {
    result.innerHTML = "Erro ao buscar clima.";
  }
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 99) return "⛈️";
  return "🌤️";
}
