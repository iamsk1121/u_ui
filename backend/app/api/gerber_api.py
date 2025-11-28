import os
import re
import base64
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

def get_master_image_path(json_path: str) -> str:
    base_path = r"\\10.0.0.225\ati\VS DATA"

    json_path = json_path.replace("/", "\\")

    match = re.search(
        r'(?P<machine>M\d{2}V\d)\\(?P<item_code>[^\\]+)\\(?P<lot>[^\\]+)\\[^\\]+\\(?P<filename>[^\\]+)\.json$',
        json_path
  
    )
    if not match:
        raise ValueError("json_path 구조 오류.")
    
    

    machine = match.group("machine")
    item_code = match.group("item_code")
    lot = match.group("lot")
    filename = match.group("filename")

    suffix_match = re.search(r'-(S\d{2}-C\d+)$', filename)
    if not suffix_match:
        raise ValueError("Sorter 코드 파싱 실패.")
    
    sortor = suffix_match.group(1)

    master_path = os.path.join(
        base_path,
        machine,
        item_code,
        f"{item_code}_{lot}",
        f"{item_code}_{lot}-{sortor}",
        f"{item_code}_Master_Unit.bmp"
    )

    print(master_path)

    return master_path

def crop_image(image, center_x, center_y, crop_size):

    height, width = image.shape[:2]

    cx = int(width * center_x)
    cy = int(height * center_y)

    half = crop_size // 2

    x1, y1 = cx - half, cy - half
    x2, y2 = cx + half, cy + half

    result = np.zeros((crop_size, crop_size), dtype=np.uint8)

    copy_x1 = max(0, x1)
    copy_x2 = min(width, x2)
    copy_y1 = max(0, y1)
    copy_y2 = min(height, y2)

    paste_x1 = max(0, -x1)
    paste_y1 = max(0, -y1)

    result[paste_y1:paste_y1 + (copy_y2 - copy_y1),
           paste_x1:paste_x1 + (copy_x2 - copy_x1)] = image[copy_y1:copy_y2, copy_x1:copy_x2]

    return result

def encode_img(img):
    _, buffer = cv2.imencode(".png", img)
    return base64.b64encode(buffer).decode("utf-8")

@router.get("/image/gerber")
def get_gerber_crop(json_path: str = Query(..., allow_reserved=True), cx: str = Query(...), cy: str = Query(...), defect_width:str = Query(...), defect_height: str = Query(...)):

    try:
        cx = float(cx.strip())
        cy = float(cy.strip())
        defect_width = float(defect_width.strip())
        defect_height = float( defect_height.strip())
    except Exception:
        raise HTTPException(400, "cx, cy, width, height 값 숫자 변환 실패 ")

    crop_size = int(max(defect_width, defect_height) * 1.2) if defect_width > 400 or defect_height > 400 else 400

    try:
        gerber_path = get_master_image_path(json_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not os.path.exists(gerber_path):
        raise HTTPException(status_code=404, detail="Gerber 파일 없음.")

    with open(gerber_path, "rb") as f:
        bytes_arr = np.asarray(bytearray(f.read()), dtype=np.uint8)
        full = cv2.imdecode(bytes_arr, cv2.IMREAD_GRAYSCALE)

    if full is None:
        raise HTTPException(status_code=500, detail="이미지 로드 실패")

    cropped = crop_image(full, cx, cy, crop_size)

    final_img = cv2.resize(cropped, (400, 400), interpolation=cv2.INTER_AREA)

    return {
        "crop_size": crop_size,
        "image": encode_img(final_img)
    }
