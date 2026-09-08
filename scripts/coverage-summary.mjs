import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

const { total } = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'))
const metrics = ['lines', 'statements', 'functions', 'branches']
for (const metric of metrics) {
  const value = total?.[metric]
  if (!value || !Number.isFinite(value.pct) || value.pct < 0 || value.pct > 100) {
    throw new Error('Invalid coverage metric: ' + metric)
  }
}

writeFileSync('coverage/badge.json', JSON.stringify({
  schemaVersion: 1,
  label: 'unit coverage (lines)',
  message: total.lines.pct.toFixed(2) + '%',
  color: total.lines.pct >= 80 ? 'green' : total.lines.pct >= 60 ? 'yellow' : 'orange',
}, null, 2) + '\n')

const summary = [
  '## Unit and component test coverage',
  '',
  '| Metric | Covered | Total | Percentage |',
  '| --- | ---: | ---: | ---: |',
  ...metrics.map((metric) => {
    const value = total[metric]
    return '| ' + metric + ' | ' + value.covered + ' | ' + value.total + ' | ' + value.pct + '% |'
  }),
  '',
  'Scope: production TypeScript in src, embed and mf, including unimported modules.',
  'Excludes type declarations, tests, stories and test infrastructure. Storybook and E2E coverage are not combined.',
  '',
].join('\n')
writeFileSync('coverage/summary.md', summary)
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
}
