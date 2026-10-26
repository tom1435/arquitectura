// probando deploy

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? 
    "http://localhost:3000"
    : "https://nvebelnt8f.execute-api.us-east-1.amazonaws.com/api";

const elements = {
  city: document.querySelector("#city"),
  refreshButton: document.querySelector("#refresh-button"),
  loading: document.querySelector("#loading"),
  error: document.querySelector("#error"),
  weatherContent: document.querySelector("#weather-content"),

  riskCard: document.querySelector("#risk-card"),
  riskLabel: document.querySelector("#risk-label"),
  riskMessage: document.querySelector("#risk-message"),
  riskIndicator: document.querySelector("#risk-indicator"),

  temperature: document.querySelector("#temperature"),
  rain: document.querySelector("#rain"),
  probability: document.querySelector("#probability"),
  wind: document.querySelector("#wind"),

  cityName: document.querySelector("#city-name"),
  hourlyForecast: document.querySelector("#hourly-forecast"),

  backendVersion: document.querySelector("#backend-version"),
  generatedAt: document.querySelector("#generated-at"),
  source: document.querySelector("#source"),
};

async function loadWeather() {
  const city = elements.city.value;

  setLoadingState(true);

  try {
    const response = await fetch(
      `${API_BASE_URL}/weather?city=${encodeURIComponent(city)}`,
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "No fue posible obtener el pronóstico");
    }

    const weather = await response.json();

    renderWeather(weather);
    showWeather();
  } catch (error) {
    console.error(error);
    showError(error.message);
  } finally {
    setLoadingState(false);
  }
}

function renderWeather(weather) {
  elements.cityName.textContent = weather.city.name;

  const riskLevel = weather.risk?.level ?? "UNKNOWN";

  elements.riskLabel.textContent =
    weather.risk?.label ?? riskLevel;

  elements.riskMessage.textContent =
    weather.risk?.message ?? "Sin información de riesgo";

  elements.riskIndicator.textContent =
    getRiskSymbol(riskLevel);

  elements.riskCard.className = "risk-card";
  elements.riskCard.classList.add(
    getRiskClass(riskLevel),
  );

  elements.temperature.textContent = formatNumber(
    weather.current.temperature,
  );

  elements.rain.textContent = formatNumber(
    weather.forecast.rainNext24Hours,
  );

  elements.probability.textContent = formatNumber(
    weather.forecast.maximumPrecipitationProbability,
    0,
  );

  elements.wind.textContent = formatNumber(
    weather.current.windSpeed,
  );

  elements.backendVersion.textContent =
    weather.metadata.backendVersion;

  elements.generatedAt.textContent = formatDateTime(
    weather.metadata.generatedAt,
  );

  elements.source.textContent = weather.metadata.source;

  renderHourlyForecast(weather.forecast.hours);
}

function renderHourlyForecast(hours) {
  elements.hourlyForecast.innerHTML = "";

  const visibleHours = hours.slice(0, 12);

  const maximumRain = Math.max(
    ...visibleHours.map((hour) => hour.precipitation),
    1,
  );

  visibleHours.forEach((hour) => {
    const card = document.createElement("article");
    card.className = "hour-card";

    const barHeight = Math.max(
      (hour.precipitation / maximumRain) * 84,
      4,
    );

    card.innerHTML = `
      <div class="hour-bar-container">
        <div
          class="hour-bar"
          style="height: ${barHeight}px"
          title="${formatNumber(hour.precipitation)} mm"
        ></div>
      </div>

      <p class="hour-rain">
        ${formatNumber(hour.precipitation)} mm
      </p>

      <p class="hour-time">
        ${formatHour(hour.time)}
      </p>
    `;

    elements.hourlyForecast.appendChild(card);
  });
}

function setLoadingState(isLoading) {
  elements.refreshButton.disabled = isLoading;

  elements.refreshButton.textContent = isLoading
    ? "Actualizando..."
    : "Actualizar pronóstico";

  elements.loading.classList.toggle("hidden", !isLoading);
}

function showWeather() {
  elements.error.classList.add("hidden");
  elements.weatherContent.classList.remove("hidden");
}

function showError(message) {
  elements.weatherContent.classList.add("hidden");
  elements.error.textContent = message;
  elements.error.classList.remove("hidden");
}

function getRiskClass(level) {
  const classes = {
    LOW: "risk-low",
    MODERATE: "risk-moderate",
    HIGH: "risk-high",
  };

  return classes[level] ?? "risk-low";
}

function getRiskSymbol(level) {
  const symbols = {
    LOW: "✓",
    MODERATE: "!",
    HIGH: "!!",
  };

  return symbols[level] ?? "?";
}

function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatHour(value) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

elements.refreshButton.addEventListener("click", loadWeather);
elements.city.addEventListener("change", loadWeather);

loadWeather();