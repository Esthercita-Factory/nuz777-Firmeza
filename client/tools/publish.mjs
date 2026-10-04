// Publica el bundle de Angular en Firmeza.Web/wwwroot para que el host lo sirva como SPA.
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(clientRoot, "dist", "client", "browser");
const target = join(clientRoot, "..", "Firmeza.Web", "wwwroot");

const entries = await readdir(source, { withFileTypes: true });
if (!entries.some((entry) => entry.isFile() && entry.name === "index.html")) {
    console.error(`No se encontro index.html en ${source}. Revisa el build de Angular.`);
    process.exit(1);
}

await mkdir(target, { recursive: true });
for (const entry of await readdir(target, { withFileTypes: true })) {
    await rm(join(target, entry.name), { recursive: true, force: true });
}
await cp(source, target, { recursive: true });

console.log(`Cliente Angular publicado en ${target}`);
