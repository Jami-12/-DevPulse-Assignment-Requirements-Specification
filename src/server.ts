import app from "./app";
import config from "./config";
import { initDB } from "./db/db";

const start = async () => {
  await initDB();

  app.listen(config.port || 5000, () => {
    console.log(`Server running on ${config.port}`);
  });
};

start();