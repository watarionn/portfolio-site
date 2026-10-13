# Anime semantic U-Net / ONNX provenance
Upstream: https://github.com/siyeong0/Anime-Face-Segmentation (MIT, 2025 siyeong).
Checkpoint: model/UNet.pth, 6,428,741 bytes, git blob e4a938d4aff61a1a639f55bc559f7fe1c9237f1a.
Converted with local PyTorch 2.12 (CPU), torchvision MobileNetV2 weights=None
(no pretrained-network download), strict load_state_dict, model.eval(), torch.onnx.export(opset 17, dynamo=False).
Input: 1x3x512x512 float32 RGB /255; Output: 1x7x512x512 softmax.
Classes: background, hair, eye, mouth, face, skin, clothes (upstream util.PALETTE).
ONNX SHA256: 5cc5d4ede049329681beb18b064bd73efdd7edd1437f9534c682d1c7b5a3f899
License: ANIME_MODEL_LICENSE.txt. No upstream Python source included in bundled runtime.
This network is anime face focused and lacks separate arms, legs, upper/lower garments.
Quality gains over existing photo model require annotated anime evaluation; not asserted here.
