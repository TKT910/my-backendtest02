#!/usr/bin/env python3
"""
AI生成キャッシュをクリアするスクリプト
"""

import os
import shutil
from pathlib import Path

CACHE_DIR = Path(__file__).parent.parent / "data" / "ai_cache"

def clear_cache():
    if CACHE_DIR.exists():
        file_count = len(list(CACHE_DIR.glob("*.json")))
        shutil.rmtree(CACHE_DIR)
        print(f"✅ キャッシュをクリアしました ({file_count} ファイル削除)")
    else:
        print("ℹ️  キャッシュディレクトリが見つかりません")

if __name__ == "__main__":
    clear_cache()
