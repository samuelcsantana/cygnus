import { readFileSync } from 'node:fs'

/**
 * Compares the hand-written Zod schemas against cygnus-api's published
 * `openapi.json`, and reports drift **before** it reaches a user as a ZodError.
 *
 * It exists because of one concrete case: from 13/08 to 27/08/2026 the vaccine
 * calendar did not load, because the front required `guidance` and
 * `recommendationKind` and the API did not send them. The response was **200**,
 * so there was no error in the log, none in Sentry and none in any test — the
 * screen simply said "could not load", and nobody noticed for thirteen days.
 * This finds that class of defect with nothing running, because the contract is
 * a versioned file and the other repo gates on it not lying.
 *
 * **Runs in CI since 01/09/2026** (`.github/workflows/ci.yml`), which is why it
 * lives here rather than in `docs/`: that folder is gitignored, and the pipeline
 * cannot run what git does not have.
 *
 * It fetches the contract over the network on every run, deliberately. The
 * alternative was committing a copy, and a stale copy leaves the gate **green**
 * while production drifts — precisely the false green it exists to remove. The
 * accepted cost is that a raw.githubusercontent outage turns a PR red for an
 * unrelated reason; `CONTRATO=` is the way around it when that happens.
 *
 *   npm run contract:check
 *   CONTRACT=/path/to/openapi.json npm run contract:check
 */

// No third-party dependency, and deliberately not importing the probes'
// `lib.mjs`: that module loads Playwright and axe at the top level, and a
// contract checker has no business dragging a browser into the pipeline.
const GREEN = '[32m'
const RED = '[31m'
const RESET = '[0m'

function reportRow(passed, text) {
  console.log(`${passed ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`}  ${text}`)
}

function summarise(label, failures) {
  console.log('')
  if (failures === 0) {
    console.log(`${GREEN}✓${RESET} ${label}: no failures`)
    process.exit(0)
  }
  console.log(`${RED}✗${RESET} ${label}: ${failures} failure(s)`)
  process.exit(1)
}

const CONTRACT_URL = 'https://raw.githubusercontent.com/samuelcsantana/cygnus-api/main/openapi.json'

const spec = process.env.CONTRACT
  ? JSON.parse(readFileSync(process.env.CONTRACT, 'utf8'))
  : await (await fetch(CONTRACT_URL)).json()

const babies = await import('../src/features/babies/api/babies.schemas.ts')
const invites = await import('../src/features/babies/api/invites.schemas.ts')
const vaccines = await import('../src/features/vaccines/api/vaccines.schemas.ts')
const appointments = await import('../src/features/appointments/api/appointments.schemas.ts')
const milestones = await import('../src/features/milestones/api/milestones.schemas.ts')
const notifications = await import('../src/features/notifications/api/notifications.schemas.ts')
const auth = await import('../src/features/auth/api/auth.schemas.ts')
const legal = await import('../src/features/legal/api/legal.schemas.ts')

/**
 * The map is explicit on purpose. Deriving which schema serves which endpoint
 * would mean following `*.api.ts` and guessing; written by hand it **is** the
 * documentation of which contract the front believes it consumes — and a new
 * endpoint with no entry here shows up as a gap rather than as silence.
 */
const ENDPOINTS = [
  { path: '/babies', method: 'get', schema: babies.babyListSchema },
  { path: '/auth/me', method: 'get', schema: auth.userSchema },
  { path: '/invites/{code}', method: 'get', schema: invites.invitePreviewSchema },
  { path: '/babies/{babyId}/guardians', method: 'get', schema: babies.guardianListSchema },
  { path: '/babies/{babyId}/vaccines', method: 'get', schema: vaccines.vaccineCalendarSchema },
  { path: '/babies/{babyId}/vaccines/adhoc', method: 'get', schema: vaccines.adhocVaccineListSchema },
  { path: '/babies/{babyId}/appointments', method: 'get', schema: appointments.appointmentListSchema },
  { path: '/babies/{babyId}/milestones', method: 'get', schema: milestones.milestoneListSchema },
  { path: '/notifications', method: 'get', schema: notifications.notificationListSchema },
  { path: '/legal/acceptances', method: 'get', schema: legal.legalAcceptanceListSchema },
]

/** Unwraps `z.array(...)` and `.nullable()/.optional()` down to the object. */
function zodObjectOf(schema) {
  let current = schema
  for (let i = 0; i < 8 && current; i++) {
    const kind = current._def?.typeName
    if (kind === 'ZodObject') return current
    if (kind === 'ZodArray') current = current._def.type
    else if (kind === 'ZodNullable' || kind === 'ZodOptional') current = current._def.innerType
    else return null
  }
  return null
}

const isZodArray = (schema) => schema?._def?.typeName === 'ZodArray'

/** Same on the OpenAPI side: an array of objects becomes the item schema. */
function openApiObjectOf(schema) {
  if (!schema) return null
  if (schema.type === 'array') return schema.items ?? null
  return schema.type === 'object' || schema.properties ? schema : null
}

let failures = 0

for (const { path, method, schema } of ENDPOINTS) {
  const op = spec.paths?.[path]?.[method]
  const okResponse = op?.responses?.['200'] ?? op?.responses?.['201']
  const contract = okResponse?.content?.['application/json']?.schema

  if (!contract) {
    reportRow(false, `${method.toUpperCase()} ${path}  — not present in the published contract`)
    failures++
    continue
  }

  // **Shape** drift, checked before any field: an array where the front expects
  // an object (or the reverse) breaks the whole parse on its own, and that is
  // exactly what happened to the vaccine calendar.
  const contractIsArray = contract.type === 'array'
  if (contractIsArray !== isZodArray(schema)) {
    reportRow(false, `${method.toUpperCase()} ${path}`)
    console.log(`        shape differs: contract returns ${contractIsArray ? 'an array' : 'an object'}, front expects ${isZodArray(schema) ? 'an array' : 'an object'}`)
    failures++
    continue
  }

  const zodObj = zodObjectOf(schema)
  const apiObj = openApiObjectOf(contract)
  if (!zodObj || !apiObj?.properties) {
    reportRow(true, `${method.toUpperCase()} ${path}  (not comparable field by field — only the shape was checked)`)
    continue
  }

  const fromContract = new Set(Object.keys(apiObj.properties))
  const requiredByFront = Object.entries(zodObj.shape)
    .filter(([, value]) => !value.isOptional?.())
    .map(([key]) => key)

  const missing = requiredByFront.filter((field) => !fromContract.has(field))
  const ignored = [...fromContract].filter((field) => !(field in zodObj.shape))

  if (missing.length > 0) {
    reportRow(false, `${method.toUpperCase()} ${path}`)
    console.log(`        the front REQUIRES and the API does not send: ${missing.join(', ')}`)
    console.log(`        → the parse fails and the screen shows an error, while the response arrives 200`)
    failures++
  } else {
    reportRow(true, `${method.toUpperCase()} ${path}`)
  }

  // An extra field is informational, never a failure: the API serves other clients too.
  if (ignored.length > 0) console.log(`        · the API sends and the front ignores: ${ignored.join(', ')}`)
}

summarise("the front's contract against the published openapi.json", failures)
