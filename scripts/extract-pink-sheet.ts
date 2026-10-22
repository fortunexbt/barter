// Extracts the reference prices the lab uses from the World Bank Pink Sheet workbook.
// Usage: npm run data:prices -- <CMO-Historical-Data-Monthly.xlsx URL>
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

const OUTPUT = new URL("../client/src/features/protocol-lab/pink-sheet.json", import.meta.url);

// Column headers from the "Monthly Prices" sheet and the opening words of each
// series in the "Description" sheet.
const SERIES = [
  { id: "copper", column: "Copper", description: "Copper (LME)" },
  { id: "coffee-arabica", column: "Coffee, Arabica", description: "Coffee, Arabica (ICO)" },
  { id: "cocoa", column: "Cocoa", description: "Cocoa (ICCO)" },
  { id: "wheat-us-hrw", column: "Wheat, US HRW", description: "Wheat (U.S.), no. 2 hard red winter" },
  { id: "urea", column: "Urea", description: "Urea, (Ukraine)" },
  { id: "rice-thai-5", column: "Rice, Thai 5%", description: "Rice (Thailand), 5% broken" },
] as const;

function unzip(archive: Buffer): Map<string, Buffer> {
  let end = archive.length - 22;
  while (end >= 0 && archive.readUInt32LE(end) !== 0x06054b50) end -= 1;
  if (end < 0) throw new Error("Not a zip archive");

  const files = new Map<string, Buffer>();
  const count = archive.readUInt16LE(end + 10);
  let entry = archive.readUInt32LE(end + 16);

  for (let index = 0; index < count; index += 1) {
    if (archive.readUInt32LE(entry) !== 0x02014b50) throw new Error("Corrupt central directory");
    const method = archive.readUInt16LE(entry + 10);
    const size = archive.readUInt32LE(entry + 20);
    const nameLength = archive.readUInt16LE(entry + 28);
    const extraLength = archive.readUInt16LE(entry + 30);
    const commentLength = archive.readUInt16LE(entry + 32);
    const local = archive.readUInt32LE(entry + 42);
    const name = archive.toString("utf8", entry + 46, entry + 46 + nameLength);
    const start = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
    const data = archive.subarray(start, start + size);

    files.set(name, method === 8 ? inflateRawSync(data) : Buffer.from(data));
    entry += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

const decode = (text: string) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

const textOf = (xml: string) =>
  decode([...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => match[1]).join(""));

function readSheet(files: Map<string, Buffer>, sheetName: string): Map<number, Map<string, string>> {
  const read = (path: string) => {
    const file = files.get(path);
    if (!file) throw new Error(`Workbook is missing ${path}`);
    return file.toString("utf8");
  };
  const shared = [...read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    textOf(match[1]),
  );
  const sheet = [...read("xl/workbook.xml").matchAll(/<sheet\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => tag.includes(`name="${sheetName}"`));
  const relationId = sheet?.match(/r:id="([^"]+)"/)?.[1];
  if (!relationId) throw new Error(`Workbook has no sheet named ${sheetName}`);
  const target = read("xl/_rels/workbook.xml.rels").match(
    new RegExp(`<Relationship\\b[^>]*Id="${relationId}"[^>]*Target="([^"]+)"`),
  )?.[1];
  if (!target) throw new Error(`No relationship ${relationId}`);
  const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;

  const rows = new Map<number, Map<string, string>>();
  for (const row of read(path).matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = new Map<string, string>();
    for (const cell of row[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const column = cell[1].match(/\br="([A-Z]+)\d+"/)?.[1];
      const body = cell[2] ?? "";
      const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (!column) continue;
      if (/\bt="s"/.test(cell[1]) && value !== undefined) cells.set(column, shared[Number(value)]);
      else if (/\bt="inlineStr"/.test(cell[1])) cells.set(column, textOf(body));
      else if (value !== undefined) cells.set(column, decode(value));
    }
    rows.set(Number(row[1]), cells);
  }
  return rows;
}

const url = process.argv[2];
if (!url) throw new Error("Pass the CMO-Historical-Data-Monthly.xlsx URL");

const response = await fetch(url);
if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
const workbook = Buffer.from(await response.arrayBuffer());
const files = unzip(workbook);
const prices = readSheet(files, "Monthly Prices");
const descriptions = readSheet(files, "Description");

const updated = prices.get(4)?.get("A")?.match(/^Updated on (.+)$/)?.[1];
const headers = prices.get(5);
const units = prices.get(6);
if (!updated || !headers || !units) throw new Error("Unexpected Monthly Prices layout");

const isMonth = (row: number) => /^\d{4}M\d{2}$/.test(prices.get(row)?.get("A") ?? "");
const lastRow = Math.max(...[...prices.keys()].filter(isMonth));
const period = prices.get(lastRow)!.get("A")!;

const series = Object.fromEntries(
  SERIES.map(({ id, column, description }) => {
    const matches = [...headers].filter(([, header]) => header.trim() === column);
    if (matches.length !== 1) throw new Error(`Expected one "${column}" column, found ${matches.length}`);
    const [letter] = matches[0];
    const unit = units.get(letter)?.replace(/^\((.+)\)$/, "$1");
    const value = Number(prices.get(lastRow)!.get(letter));
    const text = [...descriptions.values()]
      .flatMap((cells) => [...cells.values()])
      .find((cell) => cell.startsWith(description));

    if (unit !== "$/mt" && unit !== "$/kg") throw new Error(`${column} is quoted in ${unit}`);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${column} has no ${period} price`);
    if (!text) throw new Error(`No description starts with "${description}"`);

    return [id, { column, unit, value, description: text.replace(/\s+/g, " ").trim() }];
  }),
);

const extract = {
  source: {
    title: "World Bank Commodity Price Data (The Pink Sheet), monthly prices",
    publisher: "World Bank",
    page: "https://www.worldbank.org/en/research/commodity-markets",
    url,
    sha256: createHash("sha256").update(workbook).digest("hex"),
    updated,
    licence: "CC BY 4.0",
    licenceUrl: "https://datacatalog.worldbank.org/public-licenses#cc-by",
  },
  period: `${period.slice(0, 4)}-${period.slice(5)}`,
  series,
};

writeFileSync(OUTPUT, `${JSON.stringify(extract, null, 2)}\n`);
console.log(`Wrote ${SERIES.length} series for ${extract.period} to ${OUTPUT.pathname}`);
