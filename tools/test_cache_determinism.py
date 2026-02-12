#!/usr/bin/env python3
"""
キャッシング機構のテスト（決定性の検証）
同じテキストを複数回送信して、同じ質問セットが返されるか確認
"""

import sys
import json
import requests
from pathlib import Path

# テスト用テキスト
TEST_TEXT = """今回の議論では、主に先週の進捗について報告、研究タイトルとプロンプトに関する議論を行った。
まず、UIの改善について報告した。機能を追加すればするほどいいというものではないというのを肝に銘じておく。"""

API_URL = "http://localhost:3000/api/generate"

def test_cache_determinism(num_requests=3):
    """複数回リクエストして決定性を確認"""
    
    results = []
    print(f"🧪 {num_requests}回送信テストを開始します...\n")
    
    for i in range(num_requests):
        try:
            response = requests.post(
                API_URL,
                json={"prompt": TEST_TEXT},
                timeout=30
            )
            response.raise_for_status()
            questions = response.json()
            results.append(questions)
            
            print(f"📝 リクエスト #{i+1}:")
            print(f"   └─ 質問数: {len(questions)}")
            if questions:
                print(f"   └─ 最初の質問ID: {questions[0].get('templateType', 'unknown')}")
        except Exception as e:
            print(f"❌ エラー (リクエスト #{i+1}): {e}")
            return False
    
    print("\n" + "="*60)
    
    # 決定性チェック
    if len(results) < 2:
        print("⚠️  十分なレスポンスが得られません")
        return False
    
    is_deterministic = True
    for i in range(1, len(results)):
        if json.dumps(results[i], sort_keys=True) == json.dumps(results[0], sort_keys=True):
            print(f"✅ リクエスト #{i+1} = リクエスト #1 (一致)")
        else:
            print(f"❌ リクエスト #{i+1} ≠ リクエスト #1 (不一致)")
            is_deterministic = False
    
    print("="*60)
    
    if is_deterministic:
        print("\n🎉 決定性テスト: PASS")
        print(f"   同じテキストで複数回送信した結果、常に同じ質問セット ({len(results[0])} 個) が返されました")
        return True
    else:
        print("\n❌ 決定性テスト: FAIL")
        print("   複数回送信してもテキストが異なります")
        return False

if __name__ == "__main__":
    success = test_cache_determinism(num_requests=3)
    sys.exit(0 if success else 1)
