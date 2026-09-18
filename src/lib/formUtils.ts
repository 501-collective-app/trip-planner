import type { FocusEvent } from 'react'

// Selects a numeric input's full value on focus, so typing immediately
// replaces it instead of appending after a leading "0" (which otherwise
// silently turns "200" into "0200").
export function selectOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select()
}
