import cv2 as cv
import numpy as np
import os
import random

face_cascade = cv.CascadeClassifier(cv.data.haarcascades + "haarcascade_frontalface_default.xml")

def crop_to_face(img):
    gray = cv.cvtColor(img, cv.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 6)

    if len(faces) > 0:
        (x, y, w, h) = max(faces, key=lambda b: b[2] * b[3])
        pad_x = int(w * 0.15)
        pad_y_top = int(h * 0.1)
        pad_y_bottom = int(h * 0.3)
        x_new = max(0, x - pad_x)
        y_new = max(0, y - pad_y_top)
        w_new = min(img.shape[1] - x_new, w + 2 * pad_x)
        h_new = min(img.shape[0] - y_new, h + pad_y_top + pad_y_bottom)
        return img[y_new:y_new+h_new, x_new:x_new+w_new]
    return None

def align_face(img):
    eye_cascade = cv.CascadeClassifier(cv.data.haarcascades + "haarcascade_eye.xml")
    gray = cv.cvtColor(img, cv.COLOR_RGB2GRAY)
    eyes = eye_cascade.detectMultiScale(gray)

    if len(eyes) >= 2:
        return img
    return None

def imread_unicode(path):
    try:
        return cv.imdecode(np.fromfile(path, dtype=np.uint8), cv.IMREAD_COLOR)
    except:
        return None

def preprocess_image(img):
    img = cv.GaussianBlur(img, (3, 3), 0)

    gray = cv.cvtColor(img, cv.COLOR_RGB2GRAY)
    '''gray = cv.equalizeHist(gray)'''
    clache = cv.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clache.apply(gray)

    img = cv.cvtColor(gray, cv.COLOR_GRAY2RGB)
    img = cv.normalize(img, None, alpha=0, beta=1, norm_type=cv.NORM_MINMAX)
    return img

def augment_image(img):
    img_flip = cv.flip(img, 1)
    
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    
    M_15 = cv.getRotationMatrix2D(center, 15, 1.0)
    img_rotate_15 = cv.warpAffine(img, M_15, (w, h))

    M_neg15 = cv.getRotationMatrix2D(center, -15, 1.0)
    img_rotate_neg15 = cv.warpAffine(img, M_neg15, (w, h))
    
    img_bright = cv.convertScaleAbs(img, alpha=1.0, beta=40)
    img_bright1 = cv.convertScaleAbs(img, alpha=1.0, beta=70)
    img_dark = cv.convertScaleAbs(img, alpha=1.0, beta=-40)

    img_blur = cv.GaussianBlur(img, (9, 9), 0)

    return [
        ("orig", img),
        ("flip", img_flip),
        ("rot15", img_rotate_15),
        ("rot_neg15", img_rotate_neg15),
        ("bright", img_bright),
        ("bright1", img_bright1),
        ("dark", img_dark),
        ("blur", img_blur)
    ]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RAW_DIR = os.path.join(BASE_DIR, "data_raw")
OUT_DIR = os.path.join(BASE_DIR, "dataset")

IMG_SIZE = (224, 224)

classes = {
    "FaceDetection": "FaceDetection",
    "NotFace": "NotFace"
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

            img = cv.cvtColor(img, cv.COLOR_BGR2RGB)

            face_img = crop_to_face(img)
            if face_img is None:
                print(f"No face detected, skipping: {img_path}")
                continue

            img = cv.resize(face_img, IMG_SIZE)
            img = preprocess_image(img)

            augmented_images = augment_image(img)

            for prefix, aug_img in augmented_images:
                name_without_ext = os.path.splitext(file)[0]
                new_filename = f"{prefix}_{name_without_ext}.jpg"
                
                save_path = os.path.join(save_dir, new_filename)
                
                success = cv.imwrite(save_path, aug_img)
                if not success:
                    print(f"Napaka pri shranjevanju: {save_path}")

print("dataset ready")