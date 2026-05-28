import cv2 as cv
import numpy as np
import os
import random

def imread_unicode(path):
    try:
        return cv.imdecode(np.fromfile(path, dtype=np.uint8), cv.IMREAD_COLOR)
    except:
        return None

def augment_image(img):
    img_flip = cv.flip(img, 1)
    
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    
    M_15 = cv.getRotationMatrix2D(center, 15, 1.0)
    img_rotate_15 = cv.warpAffine(img, M_15, (w, h))

    M_neg15 = cv.getRotationMatrix2D(center, -15, 1.0)
    img_rotate_neg15 = cv.warpAffine(img, M_neg15, (w, h))
    
    img_bright = cv.convertScaleAbs(img, alpha=1.0, beta=40)
    img_bright1 = cv.convertScaleAbs(img, alpha=1.0, beta=60)
    img_dark = cv.convertScaleAbs(img, alpha=1.0, beta=-40)
    img_dark1 = cv.convertScaleAbs(img, alpha=1.0, beta=-60)

    img_blur = cv.GaussianBlur(img, (9, 9), 0)

    return [
        ("orig", img),
        ("flip", img_flip),
        ("rot15", img_rotate_15),
        ("rot_neg15", img_rotate_neg15),
        ("bright", img_bright),
        ("bright1", img_bright1),
        ("dark", img_dark),
        ("dark1", img_dark1),
        ("blur", img_blur)
    ]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RAW_DIR = os.path.join(BASE_DIR, "data_raw")
OUT_DIR = os.path.join(BASE_DIR, "dataset")

IMG_SIZE = (224, 224)

classes = {
    "lopar": "lopar",
    "no_loparji": "no_loparji",
    "paketnik": "paketnik"
}

for label, folder in classes.items():
    class_path = os.path.join(RAW_DIR, folder)

    if not os.path.exists(class_path):
        print(f"Directory {class_path} does not exist. Skipping '{label}'")
        continue

    print(f"Processing {label} from {class_path}")

    files = [f for f in os.listdir(class_path) if os.path.isfile(os.path.join(class_path, f))]
    random.shuffle(files)

    total_files = len(files)
    train_end = int(total_files * 0.7)
    val_end = int(total_files * 0.85)

    splits = {
        "train": files[:train_end],
        "val": files[train_end:val_end],
        "test": files[val_end:]
    }

    for split_name, split_files in splits.items():
        save_dir = os.path.join(OUT_DIR, split_name, label)
        os.makedirs(save_dir, exist_ok=True)

        for file in split_files:
            img_path = os.path.join(class_path, file)
            img = imread_unicode(img_path)

            if img is None:
                print(f"Skipping bad image: {img_path}")
                continue

            img = cv.resize(img, IMG_SIZE)

            augmented_images = augment_image(img)

            for prefix, aug_img in augmented_images:
                new_filename = f"{prefix}_{file}"
                save_path = os.path.join(save_dir, new_filename)
                cv.imwrite(save_path, aug_img)

print("dataset ready")