import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import platform

from app.api import pms_api
from app.api import pms_detail
from app.api import pms_summary
from app.api import pms_zip
from app.api import gerber_api



logging.basicConfig(level=logging.DEBUG)


app = FastAPI()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length"],
)


BASE_PATH = r"\\10.0.0.225\ati\VS DATA"

if os.path.exists(BASE_PATH):
    print(f"[INFO] Image directory mounted: {BASE_PATH}")
    app.mount("/images", StaticFiles(directory=BASE_PATH), name="images")
else:
    print(f"[WARNING] Image path not found, skipping mount: {BASE_PATH}")


app.include_router(pms_api.router)
app.include_router(pms_detail.router)
app.include_router(pms_summary.router)
app.include_router(pms_zip.router)
app.include_router(gerber_api.router)
