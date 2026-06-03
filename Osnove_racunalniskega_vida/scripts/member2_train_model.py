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


def extract_hough_features(gray):
    edges = cv.Canny(gray, 70, 170)
    h, w = gray.shape
    diagonal = float(np.hypot(h, w))

    lines = cv.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=35,
        minLineLength=max(12, min(h, w) // 5),
        maxLineGap=max(4, min(h, w) // 16),
    )

    line_count = 0
    mean_length = 0.0
    max_length = 0.0
    angle_hist = np.zeros(6, dtype=np.float32)
    if lines is not None:
        lengths = []
        for line in lines[:80]:
            x1, y1, x2, y2 = line[0]
            dx = float(x2 - x1)
            dy = float(y2 - y1)
            length = float(np.hypot(dx, dy))
            lengths.append(length)
            angle = abs(np.degrees(np.arctan2(dy, dx))) % 180.0
            bin_id = min(int(angle / 30.0), 5)
            angle_hist[bin_id] += 1.0

        line_count = len(lengths)
        mean_length = float(np.mean(lengths) / diagonal) if lengths else 0.0
        max_length = float(np.max(lengths) / diagonal) if lengths else 0.0
        if angle_hist.sum() > 0:
            angle_hist /= angle_hist.sum()

    circles = cv.HoughCircles(
        gray,
        cv.HOUGH_GRADIENT,
        dp=1.2,
        minDist=max(12, min(h, w) // 6),
        param1=90,
        param2=22,
        minRadius=max(4, min(h, w) // 18),
        maxRadius=max(8, min(h, w) // 2),
    )

    circle_count = 0
    mean_radius = 0.0
    if circles is not None:
        circles = np.round(circles[0, :20]).astype(np.float32)
        circle_count = len(circles)
        mean_radius = float(np.mean(circles[:, 2]) / max(h, w))

    base = np.array(
        [
            min(line_count / 80.0, 1.0),
            mean_length,
            max_length,
            min(circle_count / 20.0, 1.0),
            mean_radius,
        ],
        dtype=np.float32,
    )
    return np.concatenate([base, angle_hist]).astype(np.float32)


def extract_shape_features(gray):
    edges = cv.Canny(gray, 70, 170)
    contours, _ = cv.findContours(edges, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    h, w = gray.shape
    image_area = float(h * w)

    if not contours:
        return np.zeros(8, dtype=np.float32)

    largest = max(contours, key=cv.contourArea)
    area = float(cv.contourArea(largest))
    perimeter = float(cv.arcLength(largest, True))
    x, y, box_w, box_h = cv.boundingRect(largest)
    aspect = float(box_w / box_h) if box_h else 0.0
    rect_area = float(box_w * box_h)
    extent = float(area / rect_area) if rect_area else 0.0
    circularity = float((4.0 * np.pi * area) / (perimeter * perimeter)) if perimeter else 0.0

    contour_areas = [cv.contourArea(contour) for contour in contours]
    large_contours = sum(1 for item in contour_areas if item > image_area * 0.01)

    return np.array(
        [
            min(len(contours) / 120.0, 1.0),
            min(large_contours / 20.0, 1.0),
            area / image_area,
            perimeter / float(2 * (h + w)),
            min(aspect / 6.0, 1.0),
            extent,
            circularity,
            rect_area / image_area,
        ],
        dtype=np.float32,
    )


def extract_features(path, params):
    img = read_image(path)
    size = int(params["image_size"])
    img = cv.resize(img, (size, size), interpolation=cv.INTER_AREA)
    img = cv.GaussianBlur(img, (3, 3), 0)
    gray = cv.cvtColor(img, cv.COLOR_RGB2GRAY)
    gray = cv.equalizeHist(gray)

    feature_set = params.get("feature_set", "baseline")
    parts = [
        extract_hsv_histogram(img, int(params["hist_bins"])),
        extract_edge_features(gray),
    ]
    if params["use_hog"]:
        parts.append(extract_hog_features(gray, int(params["hog_cell_size"])))
    if feature_set in {"hough", "combined"}:
        parts.append(extract_hough_features(gray))
    if feature_set in {"shape", "combined"}:
        parts.append(extract_shape_features(gray))

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


def parameter_grid(feature_set):
    if feature_set == "baseline":
        image_sizes = (96, 128)
        hist_bins_values = (8, 12)
        hog_cell_sizes = (16, 32)
        use_hog_values = (True, False)
        k_values = (1, 3, 5)
    else:
        image_sizes = (128,)
        hist_bins_values = (8, 12)
        hog_cell_sizes = (16,)
        use_hog_values = (True,)
        k_values = (1, 3)

    for image_size in image_sizes:
        for hist_bins in hist_bins_values:
            for hog_cell_size in hog_cell_sizes:
                for use_hog in use_hog_values:
                    for k in k_values:
                        yield {
                            "feature_set": feature_set,
                            "image_size": image_size,
                            "hist_bins": hist_bins,
                            "hog_cell_size": hog_cell_size,
                            "use_hog": use_hog,
                            "k": k,
                        }


def pick_best_model(train_samples, val_samples, labels, label_to_id, feature_set):
    best = None
    history = []

    for params in parameter_grid(feature_set):
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


def train_final_model(train_samples, val_samples, test_samples, labels, label_to_id, feature_set):
    best, history = pick_best_model(train_samples, val_samples, labels, label_to_id, feature_set)
    params = best["params"]

    combined_train = train_samples + val_samples
    train_x, train_y, train_paths = build_matrix(combined_train, label_to_id, params)
    test_x, test_y, test_paths = build_matrix(test_samples, label_to_id, params)
    k = min(int(params["k"]), len(train_y))
    test_pred, confidences = knn_predict(train_x, train_y, test_x, k)
    test_metrics = classification_metrics(test_y, test_pred, labels)

    return {
        "feature_set": feature_set,
        "params": params,
        "train_x": train_x,
        "train_y": train_y,
        "train_paths": train_paths,
        "test_y": test_y,
        "test_pred": test_pred,
        "test_paths": test_paths,
        "confidences": confidences,
        "validation_metrics": best["validation_metrics"],
        "test_metrics": test_metrics,
        "history": history,
        "score": (test_metrics["macro_f1"], test_metrics["accuracy"]),
    }


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
    parser.add_argument(
        "--models",
        default="baseline,hough,shape,combined",
        help="Comma-separated feature sets: baseline,hough,shape,combined.",
    )
    args = parser.parse_args()

    train_samples, val_samples, test_samples, labels, label_to_id = load_dataset(Path(args.dataset))
    output_dir = Path(args.out)
    output_dir.mkdir(parents=True, exist_ok=True)

    requested_models = [item.strip() for item in args.models.split(",") if item.strip()]
    allowed_models = {"baseline", "hough", "shape", "combined"}
    unknown_models = sorted(set(requested_models) - allowed_models)
    if unknown_models:
        raise SystemExit(f"Unknown model feature sets: {', '.join(unknown_models)}")

    model_results = []
    for feature_set in requested_models:
        result = train_final_model(train_samples, val_samples, test_samples, labels, label_to_id, feature_set)
        model_results.append(result)
        np.savez_compressed(
            output_dir / f"member2_model_{feature_set}.npz",
            train_x=result["train_x"],
            train_y=result["train_y"],
            labels=np.array(labels),
            params=json.dumps(result["params"]),
            train_paths=np.array(result["train_paths"]),
        )
        save_predictions_csv(
            output_dir / f"test_predictions_{feature_set}.csv",
            result["test_paths"],
            result["test_y"],
            result["test_pred"],
            result["confidences"],
            labels,
        )

    best_result = max(model_results, key=lambda item: item["score"])
    np.savez_compressed(
        output_dir / "member2_model.npz",
        train_x=best_result["train_x"],
        train_y=best_result["train_y"],
        labels=np.array(labels),
        params=json.dumps(best_result["params"]),
        train_paths=np.array(best_result["train_paths"]),
    )

    results = {
        "model": "Classical CV feature extractors + kNN classifier",
        "labels": labels,
        "best_model": best_result["feature_set"],
        "best_params": best_result["params"],
        "dataset_sizes": {
            "train": len(train_samples),
            "validation": len(val_samples),
            "test": len(test_samples),
            "final_train": len(train_samples + val_samples),
        },
        "validation_metrics": best_result["validation_metrics"],
        "test_metrics": best_result["test_metrics"],
        "models": {
            item["feature_set"]: {
                "best_params": item["params"],
                "validation_metrics": item["validation_metrics"],
                "test_metrics": item["test_metrics"],
                "hyperparameter_search": item["history"],
                "artifact": f"member2_model_{item['feature_set']}.npz",
                "predictions": f"test_predictions_{item['feature_set']}.csv",
            }
            for item in model_results
        },
    }

    with (output_dir / "metrics.json").open("w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2)

    save_predictions_csv(
        output_dir / "test_predictions.csv",
        best_result["test_paths"],
        best_result["test_y"],
        best_result["test_pred"],
        best_result["confidences"],
        labels,
    )

    print("Member 2 model training complete.")
    for item in model_results:
        print(
            f"{item['feature_set']}: "
            f"accuracy={item['test_metrics']['accuracy']:.4f}, "
            f"macro_f1={item['test_metrics']['macro_f1']:.4f}, "
            f"params={item['params']}"
        )
    print(f"Best model: {best_result['feature_set']}")
    print(f"Best parameters: {best_result['params']}")
    print(f"Test accuracy: {best_result['test_metrics']['accuracy']:.4f}")
    print(f"Test macro F1: {best_result['test_metrics']['macro_f1']:.4f}")
    print(f"Saved model to: {output_dir / 'member2_model.npz'}")


if __name__ == "__main__":
    main()
