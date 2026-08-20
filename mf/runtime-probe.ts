import * as React from 'react'

/**
 * What the host uses to prove the two bundles are running one React, not two.
 *
 * The claim that matters in Module Federation is not "the remote rendered" — a remote that quietly
 * loaded its own React copy also renders, right up until it touches the host's context or state and
 * behaves like a separate application. The claim is that `react` was *negotiated*: the host offered
 * its instance to the share scope, the remote asked for one, and the versions were compatible enough
 * that the container handed over the host's rather than falling back to the remote's own.
 *
 * **Why this returns function references and not a version string.** Both bundles would report
 * `19.2.x` whether or not they share an instance — a version match proves nothing. Two copies of the
 * same React are two distinct objects, so reference equality is the only assertion that can fail when
 * the sharing fails.
 *
 * **Why not a marker written onto the React object.** The obvious probe is for the host to stamp a
 * value on `React` before loading the remote and have the remote read it back. It does not survive
 * contact with reality: an ES module namespace object is sealed, so the stamp throws in strict mode,
 * and where it does not throw it only proves the two sides reached the same *wrapper*. Individual
 * exports are the stable identity — interop layers re-export the same function object, they do not
 * clone it.
 */
export interface RuntimeProbe {
  /** Reported for the record, and to make it obvious that a matching version is not the evidence. */
  reactVersion: string
  /** The remote's `useState`. Identical to the host's if and only if one React instance exists. */
  useState: typeof React.useState
  /** A second, independent reference, so a single re-exported symbol cannot produce a false positive. */
  createElement: typeof React.createElement
}

export function runtimeProbe(): RuntimeProbe {
  return {
    reactVersion: React.version,
    useState: React.useState,
    createElement: React.createElement,
  }
}
