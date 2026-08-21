import os
import sys

from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# Khai báo WEB_DIRECTORY để ComfyUI tự động serve static web assets & JS extensions
WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

print("=" * 65)
print("🏡 [Interior Studio App] Đã tải thành công Web App Extension vào ComfyUI!")
print("=" * 65)
