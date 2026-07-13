import { copyFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface FontAsset {
  filename: string;
  family: "Bricolage Grotesque" | "Fragment Mono";
  weight: 400 | 500 | 600 | 700;
  sha256: string;
  sha384: string;
}

export const FONT_ASSETS: readonly FontAsset[] = Object.freeze([
  {
    filename: "bricolage-grotesque-latin-500-normal.woff2",
    family: "Bricolage Grotesque",
    weight: 500,
    sha256: "b62688707e0820a9cf2a98e9b0349fbb348fd17f76b70a05b53e7a668e3f406f",
    sha384: "qn7O2kwYDNO8BB07VtIMUe0lUqq3WYJ/okIrACPResGQn0vViFROEt3SGde7RySe",
  },
  {
    filename: "bricolage-grotesque-latin-600-normal.woff2",
    family: "Bricolage Grotesque",
    weight: 600,
    sha256: "b34fc8c1ef0ac8798455ac2979eae4b4f90f0d327e3584d1032fa77a8a9a66ca",
    sha384: "Ilh1L/tmtUzFnpC1cwkNgBNnW+urzfbLETMexxhppi4RurOQbreAwtqAuodE8gcS",
  },
  {
    filename: "bricolage-grotesque-latin-700-normal.woff2",
    family: "Bricolage Grotesque",
    weight: 700,
    sha256: "4c373ce3c1cca41c864eb3e27c059a59fc6310547ab9c9b6cd780d387ba24206",
    sha384: "I1AMB8Mhv2nNTsttl0xrwLBvxe4XMocWs9FDGXH6AqBsgZTPNWagTukzMpe7LPST",
  },
  {
    filename: "fragment-mono-latin-400-normal.woff2",
    family: "Fragment Mono",
    weight: 400,
    sha256: "44c4e39bff5e76652a24a872cbebabccbcfb20f62c4633b27c1f2745cba86b56",
    sha384: "5pPJBXVgEAccmDzYsxRokikcIMqnLiJSV7qWM3TpHdoPoqSh8vUGD1DWsnEZB0BL",
  },
]);

export const MERMAID_VERSION = "11.16.0";
export const MERMAID_URL = `https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.min.js`;
export const MERMAID_SHA256 = "74d7c46dabca328c2294733910a8aa1ed0c37451776e8d5295da38a2b758fb9b";
export const MERMAID_SHA384 = "T/0lMUdJpd2S1ZHtRiofG3htU3xPCrFVeAQ1UUE2TJwlEJSV5NUwn30kP28n238E";

const sourceAssetDir = join(import.meta.dir, "assets");
const latinUnicodeRange = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

export async function fontFaceCss(staticMode: boolean): Promise<string> {
  return (await Promise.all(FONT_ASSETS.map(async (asset) => {
    const source = staticMode
      ? `data:font/woff2;base64,${(await readFile(join(sourceAssetDir, asset.filename))).toString("base64")}`
      : `/assets/${asset.filename}`;
    return `@font-face { font-family: "${asset.family}"; font-style: normal; font-display: swap; font-weight: ${asset.weight}; src: url("${source}") format("woff2"); unicode-range: ${latinUnicodeRange}; }`;
  }))).join("\n");
}

export async function copyFontAssets(distDir: string): Promise<void> {
  const outputDir = join(distDir, "assets");
  await mkdir(outputDir, { recursive: true });
  await Promise.all(FONT_ASSETS.map((asset) => copyFile(join(sourceAssetDir, asset.filename), join(outputDir, asset.filename))));
}

export function isFontAsset(filename: string): boolean {
  return FONT_ASSETS.some((asset) => asset.filename === filename);
}
