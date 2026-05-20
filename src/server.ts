import app from "./app";
import config from "./config";
import { initDB } from "./db/db";

const PORT = config.port || 5000;

const main = () => {
  initDB();
  app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`);
  });
};

main();
