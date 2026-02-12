#!/usr/bin/env python3
"""
ログ変換ツール（シンプル版）
JSON Lines形式のログをExcelに変換（詳細度は控えめな版）
複雑な分析が必要な場合は analyze_logs.py を使用してください
"""

import pandas as pd
import json
import glob
import os
from datetime import datetime

# 設定
LOG_DIR = "logs"
OUTPUT_FILE = "experiment_data_summary.xlsx"

def main():
    print("=" * 60)
    print("📝 ログ変換ツール (シンプル版)")
    print("=" * 60 + "\n")
    
    # 1. ログファイルをすべて探す
    log_files = sorted(glob.glob(os.path.join(LOG_DIR, "*.jsonl")))
    
    if not log_files:
        print(f"❌ エラー: '{LOG_DIR}' フォルダにログファイルが見つかりません。")
        return

    all_data = []

    print(f"📂 {len(log_files)} 個のログファイルを処理中...\n")

    # 2. 各ファイルを読み込んでリストにまとめる
    for filename in log_files:
        print(f"  📄 {os.path.basename(filename)}")
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    
                    # リスト型の中身（質問リストなど）はExcelで崩れるので文字列に変換
                    for key, value in data.items():
                        if isinstance(value, list) or isinstance(value, dict):
                            data[key] = str(value)
                            
                    all_data.append(data)
                except json.JSONDecodeError:
                    continue

    # 3. Pandasデータフレームに変換
    df = pd.read_json(json.dumps(all_data))

    # 4. 列の並び順を整理（読みやすくする）
    # 優先して左側に置きたい列
    priority_cols = ['timestamp', 'user_id', 'step']
    
    # データに含まれるその他の列
    other_cols = [c for c in df.columns if c not in priority_cols]
    
    # 列を並べ替え
    df = df[priority_cols + other_cols]

    # 5. タイムスタンプで並べ替え（念のため）
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values(by=['user_id', 'timestamp'])

    # 6. Excelファイルとして書き出し
    df.to_excel(OUTPUT_FILE, index=False)
    
    print("\n" + "=" * 60)
    print(f"✅ 変換完了！")
    print(f"📊 出力ファイル: {OUTPUT_FILE}")
    print(f"📈 データ件数: {len(df)} 行")
    print(f"👥 ユーザー数: {df['user_id'].nunique()} 人")
    print("-" * 60)
    print("\n💡 ヒント: より詳細な分析は analyze_logs.py を使用してください")
    print("=" * 60)

if __name__ == "__main__":
    main()