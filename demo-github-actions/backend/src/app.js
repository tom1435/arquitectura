const CITIES = {
  santiago: {
    name: "Santiago",
    latitude: -33.45,
    longitude: -70.66,
  },
  valparaiso: {
    name: "Valparaíso",
    latitude: -33.05,
    longitude: -71.62,
  },
  concepcion: {
    name: "Concepción",
    latitude: -36.82,
    longitude: -73.05,
  },
  temuco: {
    name: "Temuco",
    latitude: -38.74,
    longitude: -72.59,
  },
  puerto_montt: {
    name: "Puerto Montt",
    latitude: -41.47,
    longitude: -72.94,
  },
};

function calculateRisk(rainNext24Hours) {
  if (rainNext24Hours >= 30) {
    return {
      level: "HIGH",
      label: "Riesgo alto",
      message: "Se esperan precipitaciones importantes durante las próximas 24 horas.",
    };
  }

  if (rainNext24Hours >= 10) {
    return {
      level: "MODERATE",
      label: "Riesgo moderado",
      message: "Se esperan precipitaciones moderadas durante las próximas 24 horas.",
    };
  }

  return {
    level: "LOW",
    label: "Riesgo bajo",
    message: "No se esperan precipitaciones importantes durante las próximas 24 horas.",
  };
}

async function getWeather(cityKey = "santiago") {
  const normalizedCityKey = cityKey.toLowerCase().trim();
  const city = CITIES[normalizedCityKey];

  if (!city) {
    const error = new Error(`Ciudad no soportada: ${cityKey}`);
    error.statusCode = 400;
    throw error;
  }

  const params = new URLSearchParams({
    latitude: city.latitude.toString(),
    longitude: city.longitude.toString(),
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "precipitation",
      "wind_speed_10m",
    ].join(","),
    forecast_days: "2",
    timezone: "America/Santiago",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  const weatherResponse = await fetch(url, {
    signal: AbortSignal.timeout(8000),
  });

  if (!weatherResponse.ok) {
    const error = new Error(
      `Open-Meteo respondió con estado ${weatherResponse.status}`,
    );
    error.statusCode = 502;
    throw error;
  }

  const weather = await weatherResponse.json();

  const now = new Date();
  const currentHourIndex = findCurrentHourIndex(weather.hourly.time, now);
  const endIndex = Math.min(currentHourIndex + 24, weather.hourly.time.length);

  const hours = weather.hourly.time
    .slice(currentHourIndex, endIndex)
    .map((time, offset) => {
      const index = currentHourIndex + offset;

      return {
        time,
        temperature: weather.hourly.temperature_2m[index],
        precipitationProbability:
          weather.hourly.precipitation_probability[index] ?? 0,
        precipitation: weather.hourly.precipitation[index] ?? 0,
        windSpeed: weather.hourly.wind_speed_10m[index] ?? 0,
      };
    });

  const rainNext24Hours = hours.reduce(
    (total, hour) => total + hour.precipitation,
    0,
  );

  const maximumPrecipitationProbability = Math.max(
    ...hours.map((hour) => hour.precipitationProbability),
  );

  const risk = calculateRisk(rainNext24Hours);

  return {
    city: {
      key: normalizedCityKey,
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
    },
    current: {
      temperature: hours[0]?.temperature ?? null,
      precipitationProbability:
        hours[0]?.precipitationProbability ?? null,
      windSpeed: hours[0]?.windSpeed ?? null,
    },
    forecast: {
      rainNext24Hours: Number(rainNext24Hours.toFixed(1)),
      maximumPrecipitationProbability,
      hours,
    },
    risk,
    metadata: {
      backendVersion: process.env.APP_VERSION ?? "v1",
      generatedAt: new Date().toISOString(),
      source: "Open-Meteo",
    },
  };
}

function findCurrentHourIndex(times, now) {
  const currentTime = now.getTime();

  const index = times.findIndex((time) => {
    return new Date(time).getTime() >= currentTime;
  });

  return index >= 0 ? index : 0;
}

module.exports = {
  CITIES,
  calculateRisk,
  getWeather,
};