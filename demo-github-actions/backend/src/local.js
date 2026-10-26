const { getWeather } = require("./app");

async function main() {
  const city = process.argv[2] ?? "santiago";

  try {
    const weather = await getWeather(city);
    console.log(JSON.stringify(weather, null, 2));
  } catch (error) {
    console.error({
      message: error.message,
      statusCode: error.statusCode ?? 500,
    });

    process.exitCode = 1;
  }
}

main();