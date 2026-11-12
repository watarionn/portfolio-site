// The browser entry: the same `approximate()` and `toDataUri()` as the Node
// entry (index.ts), running the WebAssembly builds in reusable Web Workers
// (browser-runtime.ts). No Node APIs: a PNG result's `data` is a `Uint8Array`.
import { approximateInWorker } from "./browser-runtime.js";
import { toDataUriWith } from "./data-uri.js";
import { toResult } from "./result.js";
export { AbortError, InternalError, PrimevalError, ValidationError, } from "./errors.js";
const decodeSvg = (data) => new TextDecoder().decode(data);
export function approximate(request) {
    // `approximateInWorker` is async: a validation error is a rejection too.
    return approximateInWorker(request).then((result) => toResult(result, decodeSvg));
}
const BASE64_CHUNK = 0x8000;
function bytesToBase64(bytes) {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_CHUNK));
    }
    return btoa(binary);
}
/**
 * Encodes a result as a `data:` URI (base64).
 * @throws {ValidationError} when `result` is missing.
 */
export function toDataUri(result) {
    return toDataUriWith(result, {
        text: (text) => bytesToBase64(new TextEncoder().encode(text)),
        bytes: (data) => bytesToBase64(data instanceof Uint8Array ? data : Uint8Array.from(data)),
    });
}
