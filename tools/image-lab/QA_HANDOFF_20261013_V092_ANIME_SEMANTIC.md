# Image Lab v0.9.2 / Anime semantic comparison and browser inference

## Goal and source-of-truth
- Keep existing photo ATR SegFormer B0 quantized 18-label semantics unchanged.
- Add a real anime-specific 7-label semantic engine and visible user-controlled A/B comparison.
- Project: watarionn/portfolio-site, tools/image-lab. Respect original/source pixels, owner masks, layer merge/undo, and in-browser inference without uploads.

## Selected model
- Upstream: https://github.com/siyeong0/Anime-Face-Segmentation, MIT, upstream copyright 2025 siyeong.
- Published checkpoint model/UNet.pth: 6,428,741 bytes, git blob e4a938d4aff61a1a639f55bc559f7fe1c9237f1a.
- Architecture MobileNetV2 + U-Net, 7 labels: background, hair, eye, mouth, face, skin, clothes. NO separate upper/lower clothing, arms or legs.
- Converted locally to ONNX opset 17: PyTorch 2.12 CPU, weights=None to avoid hidden download and strict load_state_dict, eval, export, 1x3x512x512 -> 1x7x512x512.
- RGB float32 /255, square resize, no mean/std normalization (exactly like upstream ToTensor). Softmax output.
- File: assets/models/anime-face-unet-7.onnx (6,209,220 bytes), SHA256 5cc5d4ede049329681beb18b064bd73efdd7edd1437f9534c682d1c7b5a3f899.
- Full upstream MIT notice: ANIME_MODEL_LICENSE.txt. See ANIME_MODEL_PROVENANCE.md.

## Product
- Layer method selector offers: color, photo ATR-18, anime-7, and A/B comparison.
- A/B performs real inference for both models without model replacement. Two labeled classification masks and per-side layer names. Buttons select a result for editing.
- Existing merge, brush, FX, preview and export remain on the chosen model.
- AI models are fetched on demand and never upload the image. No automatic image generation.
- Returns to color segmentation when no person region is detected; A/B shows disabled choices in that case.
- On non-square images, current anime model uses square resize following upstream; accuracy for portrait/full-body inputs must be evaluated before calling it a general upgrade.

## Verification and truth constraints
- Node test suite includes anime class-major logits, original RGBA reconstruction, comparison controls, release integrity.
- Real Edge local server: 7-class anime analysis created 7 layers on deterministic synthetic anime-like test image; A/B returned valid photo and anime choices; selecting anime enters layer editor; original source canvas unchanged.
- Mobile-emulated widths 375/390/768 produced no horizontal overflow.
- ONNX vs original PyTorch on seeded random 512-square input: maximum absolute output delta 8.48e-5; class argmax different in only 1 of 262,144 pixels. This verifies conversion parity, NOT real-image segmentation accuracy.
- Existing 65/65 direct vendor trials and original ONNX WASM inference 1/1 still pass.
- Real hand-annotated anime benchmark and user physical iPhone acceptance for v0.9.2 remain OPEN.

## Next research
- Collect legally permitted anime reference images with manually reviewed hair/face/eyes/mouth/clothes masks.
- Measure per-class IoU/Dice, boundary F-score, transparent-pixel retention, and false-positive background segmentation.
- Compare photo18 mapped to comparable classes vs anime7 on same dataset; avoid declaring superior based on synthetic sample or model name.
- Explore optional advanced AnimeSeg Mask2Former only if licensing, 432+ MB footprint and iPhone runtime are acceptable. Do not upload user images by default.
- Consider aspect-ratio-preserving preprocess and label fusion only after quantified A/B evidence.
