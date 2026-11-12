// `toDataUri` shared by the Node and browser entries; each passes its own
// base64 encoders.
import { ValidationError } from "./errors.js";
export function toDataUriWith(result, base64) {
    if (!result || typeof result !== "object") {
        throw new ValidationError("result is required");
    }
    const encoded = result.format === "svg"
        ? base64.text(typeof result.data === "string" ? result.data : String(result.data))
        : base64.bytes(result.data);
    return `data:${result.mimeType};base64,${encoded}`;
}
