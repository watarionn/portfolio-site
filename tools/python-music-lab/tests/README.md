# Python Music Lab parity tests

This directory locks the browser renderer to the canonical Python Music Lab v0.6.0 Phase 02B / Phase 03B output.

The canonical case is candidate_04, seed `2026091805`, selected by the Phase 02B evaluator. It contains 614 events: Melody 135, Chords 72, Bass 96, Drums 311.

`phase03b_truth.json` records SHA-256 digests of the canonical event fixture, each post-FX track, and the final normalized mix. PCM hashes are calculated from interleaved stereo IEEE-754 Float32 little-endian samples. The final render is 2,090,340 frames at 44.1 kHz, or 47.4 seconds.

Parity means exact byte equality after the Python float64 DSP pipeline is cast to Float32. Do not replace these hashes merely to make a failing test pass. Regenerate them only from the archived Python implementation and document the intentional DSP change.

## Verified full-render parity

The canonical candidate_04 render has been compared end-to-end against the archived Python implementation. Melody, Chords, Bass, Drums, and the final normalized mix each match exactly for all 4,180,680 interleaved Float32 samples (2,090,340 stereo frames). Across the five compared outputs this is 20,903,400 exact sample comparisons with maximum difference 0.0.

The renderer must use Python-compatible round-half-to-even when converting times and DSP parameters to integer sample positions. JavaScript `Math.round()` is not equivalent at half-sample boundaries and previously caused a one-sample displacement beginning at 5.625 seconds in the canonical render.

Canonical final mix SHA-256: `235b0979ec1d249fbf54444295b339f58701bf9110a2ace77f84f9e389ab1be0`.
