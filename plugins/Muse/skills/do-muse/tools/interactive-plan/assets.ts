import { copyFile, cp, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface FontAsset {
  filename: string;
  family: "Space Grotesk" | "Barlow Condensed";
  weight: 400 | 500 | 600;
  sha256: string;
  sha384: string;
}

interface FontNoticeManifest {
  assets: Array<{
    asset: string;
    package: string;
    version: string;
    notice: string;
  }>;
}

export interface FontNotice {
  package: string;
  version: string;
  assets: string[];
  text: string;
}

export const FONT_ASSETS: readonly FontAsset[] = Object.freeze([
  {
    filename: "space-grotesk-latin-500-normal.woff2",
    family: "Space Grotesk",
    weight: 500,
    sha256: "1b1a8131d9edf975d9decee81e2f2bf504812f7a4f498e5500f28a613e22e64c",
    sha384: "Bg6xtBETlk4OH8G9p8JpunITXrv/s8tntKNJ32QbeDSgfNktSk6PphJamfR70b6a",
  },
  {
    filename: "space-grotesk-latin-600-normal.woff2",
    family: "Space Grotesk",
    weight: 600,
    sha256: "685bbbf69fa616df1ef81847c85fc76be097ddfb3468ff2257be54511ab3130f",
    sha384: "UglM4y3uagIx+6rBW+5RRW5QEstMHpJATYPvjywetDYAySJDZkmPFZMMbhamYkPe",
  },
  {
    filename: "barlow-condensed-latin-400-normal.woff2",
    family: "Barlow Condensed",
    weight: 400,
    sha256: "7fff1bb22e5773f0d1a55d3093068b6dac4539e8bb3ac23fb9f0a729df2c7bb4",
    sha384: "+sVjctU0J+mE/zRMCCrDKycD/c18b7mXUlPiMz9VprmzTUi1xwRDnAVhwzDI5e4k",
  },
  {
    filename: "barlow-condensed-latin-500-normal.woff2",
    family: "Barlow Condensed",
    weight: 500,
    sha256: "460f141ec8f6c9a1516bfd2bd9fe71656246d7a9d04a0955faf53158d8970c4c",
    sha384: "iVQMJ2wPzlVYAg3U3zOHcVY+OxYs/X/HaFWAFou8YCkD7CSeOyHm41QKEr4FwtOf",
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

export async function readFontNotices(): Promise<FontNotice[]> {
  const manifest = JSON.parse(
    await readFile(join(sourceAssetDir, "notices", "manifest.json"), "utf8"),
  ) as FontNoticeManifest;
  const expectedAssets = new Set(FONT_ASSETS.map((asset) => asset.filename));
  const noticeGroups = new Map<string, Omit<FontNotice, "text"> & { notice: string }>();

  for (const entry of manifest.assets) {
    if (!expectedAssets.has(entry.asset)) continue;
    const key = `${entry.package}\0${entry.version}\0${entry.notice}`;
    const group = noticeGroups.get(key);
    if (group) {
      group.assets.push(entry.asset);
    } else {
      noticeGroups.set(key, {
        package: entry.package,
        version: entry.version,
        assets: [entry.asset],
        notice: entry.notice,
      });
    }
    expectedAssets.delete(entry.asset);
  }

  if (expectedAssets.size > 0) {
    throw new Error(`Missing font notice metadata for: ${[...expectedAssets].join(", ")}`);
  }

  return Promise.all([...noticeGroups.values()].map(async ({ notice, ...metadata }) => ({
    ...metadata,
    text: await readFile(join(sourceAssetDir, notice), "utf8"),
  })));
}

export async function copyFontAssets(distDir: string): Promise<void> {
  const outputDir = join(distDir, "assets");
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    ...FONT_ASSETS.map((asset) => copyFile(join(sourceAssetDir, asset.filename), join(outputDir, asset.filename))),
    cp(join(sourceAssetDir, "notices"), join(outputDir, "notices"), { recursive: true }),
  ]);
}

export function isFontAsset(filename: string): boolean {
  return FONT_ASSETS.some((asset) => asset.filename === filename);
}
