`yolo11n-devices.onnx` is a fine-tuned YOLO11n model. The base weights are from
[Ultralytics assets](https://github.com/ultralytics/assets) and are licensed
under [AGPL-3.0](https://github.com/ultralytics/ultralytics/blob/main/LICENSE).

Fine-tuning used six user-provided webcam frames, reviewed proctoring evidence
of real phones and empty cases, a local remote-control and bottle hard negative,
and selected phone, tablet, calculator, remote-control, bottle, and background
examples from [Open Images](https://storage.googleapis.com/openimages/web/factsfigures_v7.html).
Private webcam and proctoring images are not included in this repository. The
exported model SHA-256 is 824E449DF10ED3A557A9CC3CEF5C5308BC5F64594E03B8BCE343CF5DF134D08F.

The detector maps phones and tablets to one `handheld device` category.
The small training and validation sets cannot establish accuracy across all
devices, cases, lighting, or camera angles. A teacher must review evidence
before concluding that a violation occurred.
