import cv2 as cv
import numpy as np
import os

def imread_unicode(path):
    try:
        return cv.imdecode(np.fromfile(path, dtype=np.uint8), cv.IMREAD_COLOR)
    except:
        return None

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

    save_dir = os.path.join(OUT_DIR, label)
    os.makedirs(save_dir, exist_ok=True)

    for file in os.listdir(class_path):

        img_path = os.path.join(class_path, file)
        img = imread_unicode(img_path)

        if img is None:
            print(f"Skipping bad image: {img_path}")
            continue

        img = cv.resize(img, IMG_SIZE)

        save_path = os.path.join(save_dir, file)
        cv.imwrite(save_path, img)

print("dataset ready")