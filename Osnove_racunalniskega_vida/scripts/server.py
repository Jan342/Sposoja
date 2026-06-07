from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from pathlib import Path
import base64
import hashlib
import hmac
import json
import re
import secrets
import shutil
import tempfile
import time
import uvicorn
import uuid

from face_id import enroll, verify_image
from member2_predict_model import classifyImage
import numpy as np
import cv2 as cv

app = FastAPI()
FACE_MODEL_DIR = Path("member2_cv_model/artifacts/face_id_users")
USER_STORE_PATH = Path("member2_cv_model/artifacts/face_id_users.json")
BOX_ASSIGNMENTS_PATH = Path("member2_cv_model/artifacts/box_assignments.json")
LOGIN_CHALLENGES = {}
CHALLENGE_TTL_SECONDS = 120

@app.post("/classifyImage")
async def classify_image(file: UploadFile = File(...)):
    file = await file.read()
    img = read_image_from_bytes(file)

    res = await classifyImage(img)
    return res


@app.post("/face/register")
async def register_face(
    username: str = Form(...),
    password: str = Form(...),
    files: list[UploadFile] = File(...),
):
    safe_username = sanitize_username(username)
    validate_password(password)
    users = load_users()
    if safe_username in users:
        raise HTTPException(status_code=409, detail="Uporabnik ze obstaja.")

    if len(files) < 3:
        raise HTTPException(status_code=400, detail="Za registracijo posljite vsaj 3 slike obraza.")

    model_path = face_model_path(safe_username)
    try:
        with tempfile.TemporaryDirectory(prefix="face_register_") as temp_dir:
            for index, upload in enumerate(files):
                target = Path(temp_dir) / f"face_{index}.jpg"
                target.write_bytes(await upload.read())

            enroll(temp_dir, model_path, safe_username)
    except (ValueError, SystemExit) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    users[safe_username] = hash_password(password)
    save_users(users)

    return {
        "registered": True,
        "username": safe_username,
        "model": str(model_path),
    }


@app.post("/auth/password")
async def verify_password(
    username: str = Form(...),
    password: str = Form(...),
):
    safe_username = sanitize_username(username)
    users = load_users()
    password_data = users.get(safe_username)
    if not password_data or not password_matches(password, password_data):
        raise HTTPException(status_code=401, detail="Napacno uporabnisko ime ali geslo.")

    challenge = str(uuid.uuid4())
    LOGIN_CHALLENGES[challenge] = {
        "username": safe_username,
        "expires_at": time.time() + CHALLENGE_TTL_SECONDS,
    }
    remove_expired_challenges()
    return {
        "password_valid": True,
        "challenge": challenge,
        "expires_in": CHALLENGE_TTL_SECONDS,
    }


@app.post("/face/login")
async def login_face(
    username: str = Form(...),
    challenge: str = Form(...),
    file: UploadFile = File(...),
):
    safe_username = sanitize_username(username)
    validate_challenge(safe_username, challenge)
    model_path = face_model_path(safe_username)
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Uporabnik ni registriran.")

    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
            temp_path = Path(temp_file.name)
            shutil.copyfileobj(file.file, temp_file)

        result = verify_image(temp_path, model_path)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    finally:
        if "temp_path" in locals():
            temp_path.unlink(missing_ok=True)

    LOGIN_CHALLENGES.pop(challenge, None)
    return {
        "authenticated": bool(result["verified"]),
        "username": safe_username if result["verified"] else None,
        "distance": result.get("distance"),
        "threshold": result.get("threshold"),
        "reason": result.get("reason"),
    }


@app.post("/access/check")
async def check_access(request: Request):
    body = await request.json()
    username = body.get("username", "").strip()
    box_id = body.get("boxId", "").strip()

    print(f"[ACCESS CHECK] username={username!r}, boxId={box_id!r}")

    if not username or not box_id:
        raise HTTPException(status_code=400, detail="Manjkata username ali boxId.")

    assignments = load_box_assignments()
    assigned_box = assignments.get(username)

    if assigned_box is None:
        print(f"[ACCESS CHECK] Zavrnjen - {username!r} nima dodeljenega paketnika.")
        return {"allowed": False, "reason": "Nimate dodeljenega paketnika."}

    allowed = str(assigned_box).lstrip("0") == str(box_id).lstrip("0")
    if allowed:
        print(f"[ACCESS CHECK] Odobren - {username!r} -> paketnik {box_id!r}")
    else:
        print(f"[ACCESS CHECK] Zavrnjen - {username!r} ima paketnik {assigned_box!r}, ne {box_id!r}")

    return {"allowed": allowed}


def sanitize_username(username):
    safe_username = re.sub(r"[^a-zA-Z0-9_-]", "", username.strip())
    if not safe_username:
        raise HTTPException(status_code=400, detail="Uporabnisko ime ni veljavno.")
    return safe_username


def face_model_path(username):
    FACE_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    return FACE_MODEL_DIR / f"{username}.npz"


def validate_password(password):
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Geslo mora imeti vsaj 6 znakov.")


def hash_password(password):
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return {
        "salt": base64.b64encode(salt).decode("ascii"),
        "hash": base64.b64encode(digest).decode("ascii"),
    }


def password_matches(password, password_data):
    try:
        salt = base64.b64decode(password_data["salt"])
        expected = base64.b64decode(password_data["hash"])
    except (KeyError, ValueError):
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return hmac.compare_digest(actual, expected)


def load_users():
    if not USER_STORE_PATH.exists():
        return {}
    try:
        return json.loads(USER_STORE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raise HTTPException(status_code=500, detail="Shramba uporabnikov ni berljiva.")


def save_users(users):
    USER_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    USER_STORE_PATH.write_text(json.dumps(users, indent=2), encoding="utf-8")


def load_box_assignments() -> dict:
    """Naloži dodelitve paketnikov iz JSON datoteke.
    Format: { "username": "boxId", ... }
    Primer: { "uros": "1265", "janez": "5432" }
    """
    if not BOX_ASSIGNMENTS_PATH.exists():
        return {}
    try:
        return json.loads(BOX_ASSIGNMENTS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raise HTTPException(status_code=500, detail="Datoteka dodelitev paketnikov ni berljiva.")


def remove_expired_challenges():
    now = time.time()
    expired = [
        challenge
        for challenge, data in LOGIN_CHALLENGES.items()
        if data["expires_at"] < now
    ]
    for challenge in expired:
        LOGIN_CHALLENGES.pop(challenge, None)


def validate_challenge(username, challenge):
    remove_expired_challenges()
    data = LOGIN_CHALLENGES.get(challenge)
    if not data or data["username"] != username:
        raise HTTPException(status_code=401, detail="Geslo ni bilo preverjeno ali pa je seja potekla.")


def read_image_from_bytes(file_bytes):
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv.imdecode(nparr, cv.IMREAD_COLOR)
    cv.imwrite("result.jpg", img) #for testing purpose.
    #return img
    return "result.jpg"


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)


