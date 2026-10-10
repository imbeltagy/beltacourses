import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 3004;

createApp().listen(port, () => {
  console.log(`files listening on :${port}`);
});
