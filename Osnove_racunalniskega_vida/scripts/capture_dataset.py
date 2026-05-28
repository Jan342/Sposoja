import cv2 as cv
import os

print("V katero mapo želite shraniti slike? (npr. lopar, paketnik, no_loparji)")
category = input("> ")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

BASE_RAW_DIR = os.path.join(SCRIPT_DIR, "..", "data_raw")

SAVE_DIR = os.path.join(BASE_RAW_DIR, category)
os.makedirs(SAVE_DIR, exist_ok=True)
print(f"Slike bodo shranjene v: {SAVE_DIR}")

cap = cv.VideoCapture(0)
counter = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    cv.imshow("Zajem slik (Presledek: Shrani, ESC: Izhod)", frame)

    key = cv.waitKey(1)

    if key == 32:
        filename = os.path.join(SAVE_DIR, f"{category}_{counter}.jpg")
        cv.imwrite(filename, frame)
        print(f"Image saved: {filename}")
        counter += 1

    elif key == 27:
        break

cap.release()
cv.destroyAllWindows()