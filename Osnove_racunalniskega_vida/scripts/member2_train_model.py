import argparse
import csv
import json
from pathlib import Path

import cv2 as cv
import numpy as np


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def read_image(path):
    data = np.fromfile(str(path), dtype=np.uint8)
    img = cv.imdecode(data, cv.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Image could not be read: {path}")
    return cv.cvtColor(img, cv.COLOR_BGR2RGB)


def list_split_images(dataset_dir, split_name):
    split_dir = dataset_dir / split_name
    if not split_dir.exists():
        return []

    samples = []
    for class_dir in sorted(p for p in split_dir.iterdir() if p.is_dir()):
        for path in sorted(class_dir.rglob("*")):
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
                samples.append((path, class_dir.name))
    return samples


def split_train_validation(train_samples, validation_ratio=0.2, seed=42):
    rng = np.random.default_rng(seed)
    by_class = {}
    for item in train_samples:
        by_class.setdefault(item[1], []).append(item)

    train_out = []
    val_out = []
    for _, items in sorted(by_class.items()):
        indices = np.arange(len(items))
        rng.shuffle(indices)
        val_count = max(1, int(round(len(items) * validation_ratio))) if len(items) > 1 else 0
        val_idx = set(indices[:val_count])
        for idx, item in enumerate(items):
            if idx in val_idx:
                val_out.append(item)
            else:
                train_out.append(item)
    return train_out, val_out


def load_dataset(dataset_dir):
    dataset_dir = Path(dataset_dir)
    train_samples = list_split_images(dataset_dir, "train")
    val_samples = list_split_images(dataset_dir, "val")
    test_samples = list_split_images(dataset_dir, "test")

    if not train_samples:
        raise SystemExit("No training images found. Expected: dataset/train/<class_name>/*.jpg")

    if not val_samples:
        train_samples, val_samples = split_train_validation(train_samples)

    if not val_samples:
        raise SystemExit("Validation images are missing. Add dataset/val or provide at least two images per class.")

    if not test_samples:
        test_samples = val_samples

    labels = sorted({label for _, label in train_samples + val_samples + test_samples})
    label_to_id = {label: idx for idx, label in enumerate(labels)}
    return train_samples, val_samples, test_samples, labels, label_to_id


def extract_hsv_histogram(img, bins):
    hsv = cv.cvtColor(img, cv.COLOR_RGB2HSV)
    hist = cv.calcHist([hsv], [0, 1, 2], None, [bins, bins, bins], [0, 180, 0, 256, 0, 256])
    hist = hist.flatten().astype(np.float32)
    total = float(hist.sum())
    if total > 0:
        hist /= total
    return hist


def extract_hog_features(gray, cell_size, bins=9):
    gx = cv.Sobel(gray, cv.CV_32F, 1, 0, ksize=3)
    gy = cv.Sobel(gray, cv.CV_32F, 0, 1, ksize=3)
    magnitude, angle = cv.cartToPolar(gx, gy, angleInDegrees=True)
    angle = np.mod(angle, 180.0)

    h, w = gray.shape
    cells_y = h // cell_size
    cells_x = w // cell_size
    if cells_x == 0 or cells_y == 0:
        return np.zeros(bins, dtype=np.float32)

    features = []
    bin_width = 180.0 / bins
    for cy in range(cells_y):
        for cx in range(cells_x):
            y0 = cy * cell_size
            x0 = cx * cell_size
            mag_cell = magnitude[y0 : y0 + cell_size, x0 : x0 + cell_size]
            ang_cell = angle[y0 : y0 + cell_size, x0 : x0 + cell_size]
            hist = np.zeros(bins, dtype=np.float32)
            bin_ids = np.minimum((ang_cell / bin_width).astype(np.int32), bins - 1)
            for bin_id in range(bins):
                hist[bin_id] = mag_cell[bin_ids == bin_id].sum()
            norm = np.linalg.norm(hist)
            if norm > 0:
                hist /= norm
            features.append(hist)
    return np.concatenate(features).astype(np.float32)


def extract_edge_features(gray):
    edges = cv.Canny(gray, 80, 160)
    return np.array([np.mean(edges > 0)], dtype=np.float32)


def extract_features(path, params):
    img = read_image(path)
    size = int(params["image_size"])
    img = cv.resize(img, (size, size), interpolation=cv.INTER_AREA)
    img = cv.GaussianBlur(img, (3, 3), 0)
    gray = cv.cvtColor(img, cv.COLOR_RGB2GRAY)
    gray = cv.equalizeHist(gray)

    parts = [
        extract_hsv_histogram(img, int(params["hist_bins"])),
        extract_edge_features(gray),
    ]
    if params["use_hog"]:
        parts.append(extract_hog_features(gray, int(params["hog_cell_size"])))

    feature = np.concatenate(parts).astype(np.float32)
    norm = np.linalg.norm(feature)
    if norm > 0:
        feature /= norm
    return feature


def build_matrix(samples, label_to_id, params):
    x_data = []
    y_data = []
    paths = []
    for path, label in samples:
        x_data.append(extract_features(path, params))
        y_data.append(label_to_id[label])
        paths.append(str(path))
    return np.vstack(x_data), np.array(y_data, dtype=np.int64), paths


def knn_predict(train_x, train_y, query_x, k):
    predictions = []
    confidences = []
    class_count = int(train_y.max()) + 1
    for row in query_x:
        distances = np.linalg.norm(train_x - row, axis=1)
        nearest = np.argsort(distances)[:k]
        votes = np.bincount(train_y[nearest], minlength=class_count)
        pred = int(np.argmax(votes))
        confidence = float(votes[pred] / k)
        predictions.append(pred)
        confidences.append(confidence)
    return np.array(predictions, dtype=np.int64), np.array(confidences, dtype=np.float32)


def classification_metrics(y_true, y_pred, labels):
    class_count = len(labels)
    confusion = np.zeros((class_count, class_count), dtype=np.int64)
    for true_id, pred_id in zip(y_true, y_pred):
        confusion[int(true_id), int(pred_id)] += 1

    per_class = {}
    for idx, label in enumerate(labels):
        tp = confusion[idx, idx]
        fp = confusion[:, idx].sum() - tp
        fn = confusion[idx, :].sum() - tp
        precision = float(tp / (tp + fp)) if (tp + fp) else 0.0
        recall = float(tp / (tp + fn)) if (tp + fn) else 0.0
        f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
        per_class[label] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": int(confusion[idx, :].sum()),
        }

    accuracy = float(np.mean(y_true == y_pred)) if len(y_true) else 0.0
    macro_f1 = float(np.mean([item["f1"] for item in per_class.values()])) if per_class else 0.0
    return {
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "per_class": per_class,
        "confusion_matrix": confusion.tolist(),
    }


def parameter_grid():
    for image_size in (96, 128):
        for hist_bins in (8, 12):
            for hog_cell_size in (16, 32):
                for use_hog in (True, False):
                    for k in (1, 3, 5):
                        yield {
                            "image_size": image_size,
                            "hist_bins": hist_bins,
                            "hog_cell_size": hog_cell_size,
                            "use_hog": use_hog,
                            "k": k,
                        }


def pick_best_model(train_samples, val_samples, labels, label_to_id):
    best = None
    history = []

    for params in parameter_grid():
        train_x, train_y, _ = build_matrix(train_samples, label_to_id, params)
        val_x, val_y, _ = build_matrix(val_samples, label_to_id, params)
        k = min(int(params["k"]), len(train_y))
        pred_y, _ = knn_predict(train_x, train_y, val_x, k)
        metrics = classification_metrics(val_y, pred_y, labels)
        score = (metrics["macro_f1"], metrics["accuracy"])
        history.append(
            {
                "params": params,
                "validation_accuracy": metrics["accuracy"],
                "validation_macro_f1": metrics["macro_f1"],
            }
        )
        if best is None or score > best["score"]:
            best = {"score": score, "params": params, "validation_metrics": metrics}

    return best, history


def save_predictions_csv(path, image_paths, y_true, y_pred, confidences, labels):
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["image_path", "true_label", "predicted_label", "confidence"])
        for image_path, true_id, pred_id, confidence in zip(image_paths, y_true, y_pred, confidences):
            writer.writerow([image_path, labels[int(true_id)], labels[int(pred_id)], f"{confidence:.4f}"])


def main():
    parser = argparse.ArgumentParser(description="Train and evaluate the member 2 computer vision model.")
    parser.add_argument("--dataset", default="dataset", help="Dataset root with train/val/test class folders.")
    parser.add_argument("--out", default="member2_cv_model/artifacts", help="Output directory for model and metrics.")
    args = parser.parse_args()

    train_samples, val_samples, test_samples, labels, label_to_id = load_dataset(Path(args.dataset))
    output_dir = Path(args.out)
    output_dir.mkdir(parents=True, exist_ok=True)

    best, history = pick_best_model(train_samples, val_samples, labels, label_to_id)
    params = best["params"]

    combined_train = train_samples + val_samples
    train_x, train_y, train_paths = build_matrix(combined_train, label_to_id, params)
    test_x, test_y, test_paths = build_matrix(test_samples, label_to_id, params)
    k = min(int(params["k"]), len(train_y))
    test_pred, confidences = knn_predict(train_x, train_y, test_x, k)
    test_metrics = classification_metrics(test_y, test_pred, labels)

    np.savez_compressed(
        output_dir / "member2_model.npz",
        train_x=train_x,
        train_y=train_y,
        labels=np.array(labels),
        params=json.dumps(params),
        train_paths=np.array(train_paths),
    )

    results = {
        "model": "Classical CV feature extractor + kNN classifier",
        "labels": labels,
        "best_params": params,
        "dataset_sizes": {
            "train": len(train_samples),
            "validation": len(val_samples),
            "test": len(test_samples),
            "final_train": len(combined_train),
        },
        "validation_metrics": best["validation_metrics"],
        "test_metrics": test_metrics,
        "hyperparameter_search": history,
    }

    with (output_dir / "metrics.json").open("w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2)

    save_predictions_csv(output_dir / "test_predictions.csv", test_paths, test_y, test_pred, confidences, labels)

    print("Member 2 model training complete.")
    print(f"Best parameters: {params}")
    print(f"Test accuracy: {test_metrics['accuracy']:.4f}")
    print(f"Test macro F1: {test_metrics['macro_f1']:.4f}")
    print(f"Saved model to: {output_dir / 'member2_model.npz'}")


if __name__ == "__main__":
    main()
