/** The public result of a binding's output; an SVG's bytes are decoded with `decodeSvg`. */
export function toResult(result, decodeSvg) {
    const { width, height } = result;
    return result.format === "svg"
        ? { format: "svg", data: decodeSvg(result.data), mimeType: "image/svg+xml", width, height }
        : { format: "png", data: result.data, mimeType: "image/png", width, height };
}
