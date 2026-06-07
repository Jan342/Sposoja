import argparse
import json
from pathlib import Path

import cv2 as cv
import numpy as np


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DEFAULT_MODEL_PATH = "member2_cv_model/artifacts/face_id_model.npz"
DEFAULT_FACE_DIR = "data_raw/face_id/me"
FACE_SIZE = 128


def read_image(path):
    path = Path(path)
    data = np.fromfile(str(path), dtype=np.uint8)
    image = cv.imdecode(data, cv.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Image could not be read: {path}")
    return image


def load_face_detector():
    cascade_path = Path(cv.data.haarcascades) / "haarcascade_frontalface_default.xml"
    detector = cv.CascadeClassifier(str(cascade_path))
    if detector.empty():
        raise RuntimeError(f"Could not load Haar face detector: {cascade_path}")
    return detector


def crop_largest_face(image, detector, margin=0.2):
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    equalized = cv.equalizeHist(gray)
    faces = detector.detectMultiScale(
        equalized,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(70, 70),
    )
    if len(faces) == 0:
        return None

    x, y, width, height = max(faces, key=lambda item: int(item[2]) * int(item[3]))
    margin_x = int(width * margin)
    margin_y = int(height * margin)
    x0 = max(0, x - margin_x)
    y0 = max(0, y - margin_y)
    x1 = min(gray.shape[1], x + width + margin_x)
    y1 = min(gray.shape[0], y + height + margin_y)
    face = gray[y0:y1, x0:x1]

    face = cv.resize(face, (FACE_SIZE, FACE_SIZE), interpolation=cv.INTER_AREA)
    clahe = cv.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(face)


def extract_dct_features(face):
    normalized = face.astype(np.float32) / 255.0
    dct = cv.dct(normalized)
    low_frequency = dct[:20, :20].flatten()
    low_frequency = low_frequency[1:]
    return low_frequency.astype(np.float32)


def extract_lbp_features(face):
    center = face[1:-1, 1:-1]
    neighbors = [
        face[:-2, :-2],
        face[:-2, 1:-1],
        face[:-2, 2:],
        face[1:-1, 2:],
        face[2:, 2:],
        face[2:, 1:-1],
        face[2:, :-2],
        face[1:-1, :-2],
    ]

    lbp = np.zeros_like(center, dtype=np.uint8)
    for bit, neighbor in enumerate(neighbors):
        lbp |= ((neighbor >= center).astype(np.uint8) << bit)

    features = []
    for row in np.array_split(lbp, 4, axis=0):
        for cell in np.array_split(row, 4, axis=1):
            coarse_codes = cell // 16
            hist = np.bincount(coarse_codes.flatten(), minlength=16).astype(np.float32)
            if hist.sum() > 0:
                hist /= hist.sum()
            features.append(hist)
    return np.concatenate(features).astype(np.float32)


def extract_face_features(face):
    feature = np.concatenate(
        [
            extract_dct_features(face),
            extract_lbp_features(face),
        ]
    ).astype(np.float32)
    norm = np.linalg.norm(feature)
    if norm > 0:
        feature /= norm
    return feature


def list_images(folder):
    folder = Path(folder)
    if not folder.exists():
        raise SystemExit(f"Face image folder does not exist: {folder}")
    return sorted(
        path
        for path in folder.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def calculate_threshold(templates):
    nearest_distances = []
    for index, template in enumerate(templates):
        other_templates = np.delete(templates, index, axis=0)
        distances = np.linalg.norm(other_templates - template, axis=1)
        nearest_distances.append(float(np.min(distances)))

    percentile = float(np.percentile(nearest_distances, 95))
    threshold = float(np.clip(percentile * 1.35 + 0.02, 0.12, 1.15))
    return threshold, nearest_distances


def enroll(face_dir, model_path, person_name, threshold_override=None):
    detector = load_face_detector()
    image_paths = list_images(face_dir)
    if len(image_paths) < 3:
        raise SystemExit("Add at least 3 clear face images before enrollment.")

    templates = []
    used_images = []
    skipped_images = []
    for path in image_paths:
        image = read_image(path)
        face = crop_largest_face(image, detector)
        if face is None:
            skipped_images.append(str(path))
            continue
        templates.append(extract_face_features(face))
        used_images.append(str(path))

    if len(templates) < 3:
        raise SystemExit("Fewer than 3 usable faces were detected. Add clearer front-facing images.")

    templates = np.vstack(templates)
    threshold, nearest_distances = calculate_threshold(templates)
    if threshold_override is not None:
        threshold = float(threshold_override)

    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        model_path,
        templates=templates,
        threshold=np.array(threshold, dtype=np.float32),
        person_name=np.array(person_name),
        used_images=np.array(used_images),
        feature_type=np.array("DCT+regional-LBP"),
        face_size=np.array(FACE_SIZE, dtype=np.int32),
    )

    result = {
        "status": "enrolled",
        "person": person_name,
        "model": str(model_path),
        "usable_images": len(used_images),
        "skipped_images": skipped_images,
        "threshold": threshold,
        "nearest_template_distances": nearest_distances,
    }
    print(json.dumps(result, indent=2))


def load_model(model_path):
    data = np.load(model_path, allow_pickle=False)
    return {
        "templates": data["templates"],
        "threshold": float(data["threshold"]),
        "person_name": str(data["person_name"]),
        "feature_type": str(data["feature_type"]),
    }


def verify_image(image_path, model_path, threshold_override=None):
    model = load_model(model_path)
    detector = load_face_detector()
    image = read_image(image_path)
    face = crop_largest_face(image, detector)

    if face is None:
        return {
            "verified": False,
            "person": None,
            "reason": "no_face_detected",
            "image": str(image_path),
        }

    feature = extract_face_features(face)
    distances = np.linalg.norm(model["templates"] - feature, axis=1)
    best_distance = float(np.min(distances))
    threshold = float(threshold_override) if threshold_override is not None else model["threshold"]
    verified = best_distance <= threshold

    return {
        "verified": verified,
        "person": model["person_name"] if verified else None,
        "distance": best_distance,
        "threshold": threshold,
        "feature_type": model["feature_type"],
        "image": str(image_path),
    }


def verify_camera(model_path, camera_index=0, threshold_override=None):
    capture = cv.VideoCapture(camera_index)
    if not capture.isOpened():
        raise SystemExit(f"Could not open camera index {camera_index}.")

    print("Press SPACE to verify the current frame. Press ESC to exit.")
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break

            cv.imshow("Face ID verification", frame)
            key = cv.waitKey(1) & 0xFF
            if key == 27:
                break
            if key == 32:
                temp_path = Path("member2_cv_model") / "artifacts" / "face_id_camera_frame.jpg"
                temp_path.parent.mkdir(parents=True, exist_ok=True)
                cv.imwrite(str(temp_path), frame)
                print(json.dumps(verify_image(temp_path, model_path, threshold_override), indent=2))
    finally:
        capture.release()
        cv.destroyAllWindows()


def build_parser():
    parser = argparse.ArgumentParser(description="Enroll and verify one person's face with classical CV features.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    enroll_parser = subparsers.add_parser("enroll", help="Create a face ID model from a folder of face images.")
    enroll_parser.add_argument("--images", default=DEFAULT_FACE_DIR)
    enroll_parser.add_argument("--model", default=DEFAULT_MODEL_PATH)
    enroll_parser.add_argument("--person", default="authorized_user")
    enroll_parser.add_argument("--threshold", type=float, default=None)

    verify_parser = subparsers.add_parser("verify", help="Verify a face image against an enrolled model.")
    verify_parser.add_argument("image")
    verify_parser.add_argument("--model", default=DEFAULT_MODEL_PATH)
    verify_parser.add_argument("--threshold", type=float, default=None)

    camera_parser = subparsers.add_parser("camera", help="Verify frames captured from a webcam.")
    camera_parser.add_argument("--model", default=DEFAULT_MODEL_PATH)
    camera_parser.add_argument("--camera-index", type=int, default=0)
    camera_parser.add_argument("--threshold", type=float, default=None)

    return parser


def main():
    args = build_parser().parse_args()
    if args.command == "enroll":
        enroll(args.images, args.model, args.person, args.threshold)
    elif args.command == "verify":
        print(json.dumps(verify_image(args.image, args.model, args.threshold), indent=2))
    elif args.command == "camera":
        verify_camera(args.model, args.camera_index, args.threshold)


if __name__ == "__main__":
    main()
