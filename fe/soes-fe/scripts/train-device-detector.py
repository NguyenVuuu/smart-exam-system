"""Experimental one-model phone/tablet fine-tuning with local webcam examples.

Personal frames and downloaded training images stay outside the repository.
Run with a Python environment containing ultralytics and Pillow. Keep a separate
camera/session test set before promoting the exported model to production.
"""

import argparse
import csv
import shutil
import urllib.request
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps
from ultralytics import YOLO


SAMPLES = {
    "19": (680, 160, 978, 692),
    "26": (966, 600, 1230, 720),
    "35": (947, 349, 1280, 720),
    "45": (560, 115, 1135, 720),
    "47": (826, 543, 1175, 720),
    "51": (664, 0, 1267, 323),
}
VALIDATION_SAMPLES = {"47"}
OPEN_IMAGES = {
    "boxes": "https://storage.googleapis.com/openimages/v5/validation-annotations-bbox.csv",
    "classes": "https://storage.googleapis.com/openimages/v7/oidv7-class-descriptions-boxable.csv",
}
TARGETS = {"Mobile phone": 339, "Tablet computer": 516}
HARD_NEGATIVE_IDS = (
    "04311ae05c027377", "0a3873442ad329c2", "0b19fbf13f8296d6",
    "0dbd358b804cdc0d", "0e5613a5e521f5c5", "12435d88b4504d3f",
    "4fe2fb3816b91c44", "6347108949f5cbe2", "8357a23d186680d7",
    "c48ad3322299db3e", "fa50309ada7120e0",
)


def download(url: str, target: Path) -> None:
    if not target.exists():
        urllib.request.urlretrieve(url, target)


def write_example(image: Path, box: tuple[float, float, float, float] | None,
                  class_id: int, split: str, root: Path) -> None:
    images = root / "images" / split
    labels = root / "labels" / split
    images.mkdir(parents=True, exist_ok=True)
    labels.mkdir(parents=True, exist_ok=True)
    target = images / image.name
    if image.resolve() != target.resolve():
        shutil.copyfile(image, target)
    if box:
        with Image.open(image) as source:
            width, height = source.size
        x1, y1, x2, y2 = box
        line = f"{class_id} {(x1+x2)/(2*width):.6f} {(y1+y2)/(2*height):.6f} {(x2-x1)/width:.6f} {(y2-y1)/height:.6f}"
    else:
        line = ""
    (labels / f"{image.stem}.txt").write_text(line, encoding="utf-8")


def prepare(samples: Path, work: Path, model: YOLO, unified_class: int | None) -> Path:
    data = work / "data"
    target_ids = {name: unified_class if unified_class is not None else identifier
                  for name, identifier in TARGETS.items()}
    for suffix, box in SAMPLES.items():
        matches = list(samples.glob(f"WIN_20261120_10_30_{suffix}_Pro.jpg"))
        if len(matches) != 1:
            raise FileNotFoundError(f"Expected one original webcam frame ending {suffix}_Pro.jpg")
        split = "val" if suffix in VALIDATION_SAMPLES else "train"
        write_example(matches[0], box, target_ids["Mobile phone"], split, data)
        if split == "train":
            if suffix in {"45", "51"}:
                with Image.open(matches[0]) as source:
                    variants = (
                        ("mirror", ImageOps.mirror(source),
                         (source.width - box[2], box[1], source.width - box[0], box[3])),
                        ("bright", ImageEnhance.Brightness(source).enhance(1.25), box),
                        ("dark", ImageEnhance.Brightness(source).enhance(0.8), box),
                    )
                    for label, variant, variant_box in variants:
                        augmented = work / f"aug-{suffix}-{label}.jpg"
                        variant.save(augmented, quality=92)
                        write_example(augmented, variant_box, target_ids["Mobile phone"], "train", data)
            # A phone-free crop from the same webcam catches face/background false positives.
            negative = work / f"negative-{suffix}.jpg"
            with Image.open(matches[0]) as source:
                source.crop((0, 0, 500, 500)).save(negative, quality=90)
            write_example(negative, None, target_ids["Mobile phone"], "train", data)

    for name, url in OPEN_IMAGES.items():
        download(url, work / f"{name}.csv")
    ids = {name: identifier for identifier, name in csv.reader((work / "classes.csv").open(encoding="utf-8"))}
    selected = defaultdict(list)
    with (work / "boxes.csv").open(encoding="utf-8") as source:
        for row in csv.DictReader(source):
            for name in TARGETS:
                if row["LabelName"] == ids[name] and row["IsDepiction"] == "0":
                    selected[name].append(row)

    for name, limit in (("Tablet computer", 13), ("Mobile phone", 20)):
        seen = set()
        for row in selected[name]:
            image_id = row["ImageID"]
            if image_id in seen or len(seen) >= limit:
                continue
            image = work / f"oi-{image_id}.jpg"
            try:
                download(f"https://open-images-dataset.s3.amazonaws.com/validation/{image_id}.jpg", image)
            except Exception:
                continue
            seen.add(image_id)
            with Image.open(image) as source:
                width, height = source.size
            box = (float(row["XMin"]) * width, float(row["YMin"]) * height,
                   float(row["XMax"]) * width, float(row["YMax"]) * height)
            write_example(image, box, target_ids[name], "val" if len(seen) % 5 == 0 else "train", data)

    for index, image_id in enumerate(HARD_NEGATIVE_IDS):
        image = work / f"neg-{image_id}.jpg"
        download(f"https://open-images-dataset.s3.amazonaws.com/validation/{image_id}.jpg", image)
        write_example(image, None, target_ids["Mobile phone"],
                      "val" if index in (1, 3, 10) else "train", data)

    config = work / "data.yaml"
    names = "\n".join(f"  {index}: {name}" for index, name in model.names.items())
    config.write_text(f"path: '{data.as_posix()}'\ntrain: images/train\nval: images/val\nnames:\n{names}\n", encoding="utf-8")
    return config


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples-dir", type=Path, required=True)
    parser.add_argument("--work-dir", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--unified-class", type=int,
                        help="Map both phones and tablets to this existing pretrained class (67 for COCO)")
    parser.add_argument("--run-name", default="experiment")
    args = parser.parse_args()
    args.work_dir.mkdir(parents=True, exist_ok=True)
    model = YOLO(str(args.model))
    config = prepare(args.samples_dir, args.work_dir, model, args.unified_class)
    result = model.train(data=str(config), epochs=args.epochs, imgsz=640, batch=2,
                         workers=0, device="cpu", project=str(args.work_dir), name=args.run_name,
                         exist_ok=True, patience=8, freeze=10, plots=False, optimizer="AdamW",
                         lr0=0.001, cos_lr=True)
    print("best weights:", result.save_dir / "weights" / "best.pt")


if __name__ == "__main__":
    main()
