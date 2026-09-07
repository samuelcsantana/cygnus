import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'

/**
 * Generates `src/features/growth/api/who-reference.ts` from the WHO Child Growth
 * Standards, downloaded from who.int at the moment it runs.
 *
 *   node scripts/build-who-growth-reference.mjs
 *
 * **Why a generator, tracked in the repo, instead of a table someone typed.**
 * These numbers are the reference a parent will compare their child against.
 * A transcription error in them is invisible — every value is plausible, none
 * throws, and the chart looks exactly as right as before. The only defence is
 * that the file can be rebuilt from the source at any time and diffed, so this
 * script is part of the product, not a scratch tool: it prints the SHA-256 of
 * every file it downloads, and writes it into the generated header.
 *
 * Scope: **0 to 5 years, which is what WHO publishes as a machine-readable
 * table.** The 5–19 growth reference (2007) is only offered as PDF charts on
 * who.int, so it is deliberately not covered here and the UI says so rather than
 * drawing a band that stops without explanation.
 *
 * Source (WHO Child Growth Standards, "expanded tables", percentiles):
 * https://www.who.int/tools/child-growth-standards/standards
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src/features/growth/api/who-reference.ts')

const CDN = 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators'

/**
 * Note the two different path segments — `expanded-tables` for weight and
 * `expandable-tables` for length/height. That is WHO's own inconsistency, not a
 * typo here; both were verified to answer 200 without a query string.
 */
const SOURCES = [
  {
    indicator: 'weight',
    sex: 'MALE',
    url: `${CDN}/weight-for-age/expanded-tables/wfa-boys-percentiles-expanded-tables.xlsx`,
  },
  {
    indicator: 'weight',
    sex: 'FEMALE',
    url: `${CDN}/weight-for-age/expanded-tables/wfa-girls-percentiles-expanded-tables.xlsx`,
  },
  {
    indicator: 'height',
    sex: 'MALE',
    url: `${CDN}/length-height-for-age/expandable-tables/lhfa-boys-percentiles-expanded-tables.xlsx`,
  },
  {
    indicator: 'height',
    sex: 'FEMALE',
    url: `${CDN}/length-height-for-age/expandable-tables/lhfa-girls-percentiles-expanded-tables.xlsx`,
  },
]

/** The five the caderneta draws. More lines is not more information at this size. */
const PERCENTILES = ['P3', 'P15', 'P50', 'P85', 'P97']

/**
 * One sample every 15 days rather than every day (1857 rows per table) or every
 * month (61). The band's shape is steepest in the first months, where monthly
 * sampling visibly corners it; every day is 30× the bytes for a curve nobody
 * can see the difference in. Measured on the generated file, not guessed.
 */
const SAMPLE_EVERY_DAYS = 15

/** 365.25 / 12 — the same conversion `ageInMonthsExactAt` uses, so x lines up. */
const DAYS_PER_MONTH = 30.4375

// ---------------------------------------------------------------------------
// A .xlsx is a zip of XML. Node ships DEFLATE but no archive reader, and this
// script deliberately has no dependencies — the whole point is that anyone can
// re-run it years from now and get the same file.
// ---------------------------------------------------------------------------

/** Reads one member of a zip by name, via the end-of-central-directory record. */
function readZipEntry(buffer, name) {
  const eocd = findEndOfCentralDirectory(buffer)
  let offset = buffer.readUInt32LE(eocd + 16)
  const count = buffer.readUInt16LE(eocd + 10)

  for (let index = 0; index < count; index++) {
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const entryName = buffer.toString('utf8', offset + 46, offset + 46 + nameLength)
    const localHeader = buffer.readUInt32LE(offset + 42)

    if (entryName === name) {
      const method = buffer.readUInt16LE(offset + 10)
      const compressedSize = buffer.readUInt32LE(offset + 20)
      // The local header repeats the name and extra fields with its own lengths;
      // the central directory's are not interchangeable with them.
      const localNameLength = buffer.readUInt16LE(localHeader + 26)
      const localExtraLength = buffer.readUInt16LE(localHeader + 28)
      const start = localHeader + 30 + localNameLength + localExtraLength
      const data = buffer.subarray(start, start + compressedSize)
      return method === 0 ? data : inflateRawSync(data)
    }

    offset += 46 + nameLength + extraLength + commentLength
  }

  throw new Error(`entrada ${name} não encontrada no arquivo`)
}

function findEndOfCentralDirectory(buffer) {
  // Scanned backwards because the record is last and its size varies with the
  // archive comment. 0x06054b50 is its signature.
  for (let offset = buffer.length - 22; offset >= 0; offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset
  }
  throw new Error('arquivo não parece um zip (sem end-of-central-directory)')
}

/** The sheet as rows of strings, resolving the shared-string table. */
function readSheet(buffer) {
  const shared = []
  try {
    const xml = readZipEntry(buffer, 'xl/sharedStrings.xml').toString('utf8')
    for (const item of xml.split('<si>').slice(1)) {
      shared.push([...item.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((match) => match[1]).join(''))
    }
  } catch {
    // A sheet of pure numbers has no shared strings, and that is not an error.
  }

  const xml = readZipEntry(buffer, 'xl/worksheets/sheet1.xml').toString('utf8')
  // Cells come both self-closing (`<c r="A1"/>`, an empty cell) and paired, and
  // the type attribute may be anywhere in the tag — hence two alternatives and a
  // second pass over the attributes rather than one clever expression.
  return [...xml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)].map((row) =>
    [...row[1].matchAll(/<c([^>]*)\/>|<c([^>]*)>(.*?)<\/c>/gs)].map((cell) => {
      const attributes = cell[1] ?? cell[2] ?? ''
      const body = cell[3] ?? ''
      const value = /<v>([^<]*)<\/v>/.exec(body)?.[1]
      if (value === undefined) return ''
      return / t="s"/.test(attributes) ? shared[Number(value)] : value
    }),
  )
}

async function download(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} em ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

/**
 * Whole grams and whole millimetres, the units the API stores and the chart
 * plots. Rounded here rather than in the client for the reason the app already
 * has written down: 15.8 * 1000 in floating point is 15800.000000000002, and
 * these numbers end up on an axis.
 */
function toApiUnits(indicator, value) {
  return Math.round(Number(value) * (indicator === 'weight' ? 1000 : 10))
}

const tables = {}
const provenance = []

for (const source of SOURCES) {
  const file = await download(source.url)
  const digest = createHash('sha256').update(file).digest('hex')
  const rows = readSheet(file)
  const header = rows[0]
  const columns = PERCENTILES.map((name) => {
    const index = header.indexOf(name)
    if (index < 0) throw new Error(`coluna ${name} ausente em ${source.url}`)
    return index
  })

  const sampled = []
  for (let index = 1; index < rows.length; index++) {
    const day = Number(rows[index][0])
    // The last row is always kept: dropping it would end the band days short of
    // five years, which reads as "the reference stops here" a month early.
    const isLast = index === rows.length - 1
    if (day % SAMPLE_EVERY_DAYS !== 0 && !isLast) continue
    sampled.push([
      Number((day / DAYS_PER_MONTH).toFixed(3)),
      ...columns.map((column) => toApiUnits(source.indicator, rows[index][column])),
    ])
  }

  tables[source.indicator] ??= {}
  tables[source.indicator][source.sex] = sampled
  provenance.push(`${source.url}\n *   sha256 ${digest} — ${rows.length - 1} linhas, ${sampled.length} amostradas`)
  console.log(`${source.indicator}/${source.sex}: ${sampled.length} amostras de ${rows.length - 1} dias`)
}

const generated = `/* eslint-disable */
/**
 * GENERATED FILE — do not edit by hand.
 *
 * Rebuild with \`node scripts/build-who-growth-reference.mjs\`, which downloads
 * the tables again and prints the checksum of each. A hand edit here is a change
 * to what a parent compares their child against, and nothing in the app would
 * notice it: every value is plausible and none of them throws.
 *
 * WHO Child Growth Standards, percentile "expanded tables", **0 to 5 years** —
 * which is the range WHO publishes as a table. The 5–19 reference (2007) exists
 * only as PDF charts, so it is not here, and the page says so instead of drawing
 * a band that stops without explaining itself.
 *
 * Downloaded ${new Date().toISOString().slice(0, 10)} from:
 *
 *   ${provenance.join('\n *   ')}
 *
 * Rows are [age in months, P3, P15, P50, P85, P97]. Weight in **grams**, height
 * in **millimetres** — the units the API stores and the chart plots, converted
 * here so nothing multiplies by 1000 at render time.
 */

export type WhoReferenceRow = readonly [number, number, number, number, number, number]

export const WHO_REFERENCE_MAX_MONTHS = 60

export const WHO_REFERENCE: Record<'weight' | 'height', Record<'MALE' | 'FEMALE', readonly WhoReferenceRow[]>> = {
${['weight', 'height']
  .map(
    (indicator) => `  ${indicator}: {
${['MALE', 'FEMALE']
  .map(
    (sex) => `    ${sex}: [
${tables[indicator][sex].map((row) => `      [${row.join(', ')}],`).join('\n')}
    ],`,
  )
  .join('\n')}
  },`,
  )
  .join('\n')}
}
`

writeFileSync(OUT, generated)
console.log(`\n${OUT} — ${(generated.length / 1024).toFixed(1)} kB`)
