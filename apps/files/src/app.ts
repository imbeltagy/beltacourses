import path from "node:path";
import express from "express";

const ASSETS_DIR = path.resolve(import.meta.dirname, "../assets");

// Same body shape as the API's errors: { code, error }.
const notFound: express.RequestHandler = (_req, res) => {
  res.status(404).json({ code: 404, error: "NOT_FOUND" });
};

export function createApp(assetsDir = ASSETS_DIR) {
  const app = express();
  app.disable("x-powered-by");

  // express.static rejects `..` traversal, hides dotfiles and only answers GET/HEAD.
  // Directories and the bare prefix are not files, so they fall through to the 404.
  app.use(
    "/assets",
    express.static(assetsDir, {
      index: false,
      redirect: false,
      dotfiles: "ignore",
      fallthrough: true,
    }),
  );

  app.use(notFound);
  return app;
}
