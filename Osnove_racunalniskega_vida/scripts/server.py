from fastapi import FastAPI, UploadFile, File
import uvicorn
from scripts.member2_predict_model import classifyImage
import numpy as np
import cv2 as cv

app = FastAPI()

@app.post("/classifyImage")
async def classify_image(file: UploadFile = File(...)):
    file = await file.read()
    img = read_image_from_bytes(file)

    res = await classifyImage(img)
    return res


def read_image_from_bytes(file_bytes):
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv.imdecode(nparr, cv.IMREAD_COLOR)
    cv.imwrite("result.jpg", img)
    #return img
    return "result.jpg"

#image = cv2.imread("racket2.jpg")
#classify(image)

#if __name__ == "__main__": za testne namene
#    uvicorn.run(app, host="127.0.0.1", port=3002)


