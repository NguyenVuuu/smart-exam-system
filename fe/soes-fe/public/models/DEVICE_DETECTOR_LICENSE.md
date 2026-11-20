`yolo11n-devices.onnx` is a fine-tuned YOLO11n model. The base weights are from
[Ultralytics assets](https://github.com/ultralytics/assets) and are licensed
under [AGPL-3.0](https://github.com/ultralytics/ultralytics/blob/main/LICENSE).

Fine-tuning used six user-provided webcam frames and selected phone, tablet,
and background examples from [Open Images](https://storage.googleapis.com/openimages/web/factsfigures_v7.html).
The user's webcam photos are not included in this repository. The exported
model SHA-256 is A29283DC010BAFED21B58D9AF33C72EB722AE6D83FD24A87BF254A96497CA84B.

The detector maps phones and tablets to one `handheld device` category.
The small training and validation sets cannot establish accuracy across all
devices, cases, lighting, or camera angles. A teacher must review evidence
before concluding that a violation occurred.
