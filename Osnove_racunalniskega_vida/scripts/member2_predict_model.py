import argparse
import json
from pathlib import Path
import numpy as np
from scripts.member2_train_model import extract_features, knn_predict

MODEL = "member2_cv_model/artifacts/member2_model.npz"

def load_model(path):
    data = np.load(path, allow_pickle=False)
    params = json.loads(str(data["params"]))
    return {
        "train_x": data["train_x"],
        "train_y": data["train_y"],
        "labels": [str(item) for item in data["labels"]],
        "params": params,
    }

async def classifyImage(image):
    model = load_model(MODEL)
    feature = extract_features(Path(image), model["params"]).reshape(1, -1)
    k = min(int(model["params"]["k"]), len(model["train_y"]))
    pred, confidence = knn_predict(model["train_x"], model["train_y"], feature, k)
    label = model["labels"][int(pred[0])]

    return json.dumps({"label": label, "confidence": float(confidence[0])}, indent=2)


''''
def main():
    #parser = argparse.ArgumentParser(description="Run prediction with the member 2 model artifact.")
    #parser.add_argument("image", help="Path to the image that should be classified.")
    #parser.add_argument("--model", default="member2_cv_model/artifacts/member2_model.npz")
    #args = parser.parse_args()

    model = load_model(Path(args.model))
    feature = extract_features(Path(args.image), model["params"]).reshape(1, -1)
    k = min(int(model["params"]["k"]), len(model["train_y"]))
    pred, confidence = knn_predict(model["train_x"], model["train_y"], feature, k)
    label = model["labels"][int(pred[0])]

    print(json.dumps({"label": label, "confidence": float(confidence[0])}, indent=2))


if __name__ == "__main__":
    main()'''
