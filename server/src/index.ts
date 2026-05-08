import { app } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const port = config.PORT;

app.listen(port, () => {
  logger.info("PrepAI server listening", { port });
});
