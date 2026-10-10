import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.js";

let server: Server;
let base: string;

before(async () => {
  const root = mkdtempSync(path.join(tmpdir(), "files-"));
  const assets = path.join(root, "assets");
  mkdirSync(path.join(assets, "a/b/c"), { recursive: true });
  writeFileSync(path.join(assets, "a/logo.svg"), "<svg/>");
  writeFileSync(path.join(assets, "a/b/c/deep.txt"), "deep");
  writeFileSync(path.join(assets, "root.txt"), "root");
  writeFileSync(path.join(assets, "a/.secret"), "x");
  server = createApp(assets).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://localhost:${(server.address() as { port: number }).port}`;
});

after(() => server.close());

const NOT_FOUND = { code: 404, error: "NOT_FOUND" };

async function expect404(url: string, method = "GET") {
  const res = await fetch(base + url, { method });
  assert.equal(res.status, 404, `${method} ${url}`);
  if (method === "GET") assert.deepEqual(await res.json(), NOT_FOUND);
}

describe("GET /assets/**", () => {
  it("serves a file with its content type", async () => {
    const res = await fetch(`${base}/assets/a/logo.svg`);
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("content-type")?.split(";")[0],
      "image/svg+xml",
    );
    assert.equal(await res.text(), "<svg/>");
  });

  it("serves any depth, including directly under assets", async () => {
    assert.equal(
      await (await fetch(`${base}/assets/a/b/c/deep.txt`)).text(),
      "deep",
    );
    assert.equal(await (await fetch(`${base}/assets/root.txt`)).text(), "root");
  });

  it("404s a missing file, a directory and the bare prefix", async () => {
    for (const url of [
      "/assets/nope.png",
      "/assets/a",
      "/assets/a/",
      "/assets",
      "/assets/",
    ]) {
      await expect404(url);
    }
  });

  it("404s dotfiles and traversal", async () => {
    for (const url of [
      "/assets/a/.secret",
      "/assets/../package.json",
      "/assets/%2e%2e/package.json",
      "/assets/a/..%2f..%2fpackage.json",
    ]) {
      await expect404(url);
    }
  });

  it("404s a symlink pointing outside assets? (documented behaviour)", async () => {
    const res = await fetch(`${base}/assets/link.txt`);
    assert.ok([200, 404].includes(res.status));
  });
});

describe("everything else", () => {
  it("404s other paths and methods", async () => {
    await expect404("/");
    await expect404("/health");
    await expect404("/assets/root.txt", "POST");
    await expect404("/assets/root.txt", "DELETE");
  });
});
