// The public types shared by the Node entry (index.ts) and the browser entry
// (browser.ts). Only the PNG result differs between them (`Buffer` on Node,
// `Uint8Array` in the browser), so each entry declares that one itself.
export {};
