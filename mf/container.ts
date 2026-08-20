/**
 * The build entry for the federated container, and the reason it is nearly empty.
 *
 * Rollup needs an entry; Module Federation does not have one in the usual sense. What a host loads
 * is `remoteEntry.js`, which the federation plugin generates — a manifest of what this container
 * exposes and what it is willing to share, not a program that runs. Nothing here is meant to
 * execute on the host's page.
 *
 * It is not empty, though, and the re-exports below are load-bearing. Naming the exposed modules
 * here keeps them in the build's module graph under their real identity, so `npm run build:mf`
 * fails on a broken import in a remote that no application route happens to reference. Without it
 * the first thing to discover a typo would be a host, at runtime, in production.
 */
export { default as VaccineSchedule } from './VaccineSchedule'
export { runtimeProbe } from './runtime-probe'
