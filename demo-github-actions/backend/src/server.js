const express = require("express");
const cors = require("cors");

const { getWeather, CITIES } = require("./app");

const app = express();

app.use(cors());

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    version: process.env.APP_VERSION ?? "v1",
    timestamp: new Date().toISOString(),
  });
});

app.get("/cities", (_, res) => {
  res.json(
    Object.values(CITIES).map((c) => ({
      key: c.name.toLowerCase().replace(" ", "_"),
      name: c.name,
    }))
  );
});

app.get("/weather", async (req, res) => {
  try {
    const city = req.query.city ?? "santiago";

    const weather = await getWeather(city);

    res.json(weather);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({
      message: err.message,
    });
  }
});

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});