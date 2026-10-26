const { getWeather, CITIES } = require("./app");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  console.log(
    JSON.stringify({
      requestId: event.requestContext?.requestId,
      method: event.requestContext?.http?.method,
      path: event.rawPath,
      query: event.queryStringParameters,
    }),
  );

  try {
    const method = event.requestContext?.http?.method ?? "GET";
    const path = event.rawPath ?? "/";

    if (method === "GET" && path === "/api/health") {
      return jsonResponse(200, {
        status: "ok",
        version: process.env.APP_VERSION ?? "v1",
        timestamp: new Date().toISOString(),
      });
    }

    if (method === "GET" && path === "/api/cities") {
      const cities = Object.entries(CITIES).map(([key, city]) => ({
        key,
        name: city.name,
      }));

      return jsonResponse(200, cities);
    }

    if (method === "GET" && path === "/api/weather") {
      const city =
        event.queryStringParameters?.city ?? "santiago";

      const weather = await getWeather(city);

      return jsonResponse(200, weather);
    }

    return jsonResponse(404, {
      message: "Ruta no encontrada",
      path,
    });
  } catch (error) {
    console.error("Error procesando solicitud:", error);

    return jsonResponse(error.statusCode ?? 500, {
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Error interno del servicio",
    });
  }
};
