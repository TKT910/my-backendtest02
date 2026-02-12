#!/usr/bin/env python3
"""
ログファイルに記録されているイベント種類とフィールドを分析
"""

import json
from pathlib import Path
from collections import defaultdict
import pandas as pd

logs_dir = Path(__file__).parent.parent / "logs"

def analyze_log_events():
    """すべてのログファイルを分析してイベント種類を集計"""
    
    log_files = sorted(logs_dir.glob("*.jsonl"))
    
    if not log_files:
        print("❌ ログファイルが見つかりません")
        return
    
    event_types = defaultdict(lambda: {"count": 0, "fields": set(), "samples": []})
    
    print("📊 ログイベント分析中...\n")
    
    # すべてのログファイルをスキャン
    total_logs = 0
    for log_file in log_files:
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    log_entry = json.loads(line)
                    total_logs += 1
                    
                    step = log_entry.get('step', 'unknown')
                    event_types[step]['count'] += 1
                    
                    # フィールドを記録
                    fields = set(log_entry.keys())
                    event_types[step]['fields'].update(fields)
                    
                    # サンプルを保存（最初の1つだけ）
                    if len(event_types[step]['samples']) == 0:
                        event_types[step]['samples'].append(log_entry)
                except json.JSONDecodeError:
                    pass
    
    print(f"📈 分析結果: {total_logs} ログ, {len(event_types)} イベントタイプ\n")
    print("="*80)
    
    # イベントタイプを出現数でソート
    sorted_events = sorted(event_types.items(), key=lambda x: x[1]['count'], reverse=True)
    
    for step, data in sorted_events:
        print(f"\n📌 {step}")
        print(f"   出現回数: {data['count']}")
        print(f"   フィールド一覧:")
        
        # 基本フィールド（すべてのイベントにある）
        base_fields = {'timestamp', 'user_id', 'step'}
        additional_fields = sorted(data['fields'] - base_fields)
        
        if additional_fields:
            for field in additional_fields:
                sample_value = data['samples'][0].get(field)
                if isinstance(sample_value, (list, dict)):
                    print(f"      • {field}: {type(sample_value).__name__}")
                elif isinstance(sample_value, str) and len(sample_value) > 50:
                    print(f"      • {field}: str (e.g., '{sample_value[:50]}...')")
                else:
                    print(f"      • {field}: {type(sample_value).__name__} (e.g., {repr(sample_value)})")
        else:
            print("      （基本フィールドのみ: timestamp, user_id, step）")
    
    print("\n" + "="*80)
    
    # CSV出力
    output_file = Path(__file__).parent.parent / "results" / "log_events_summary.csv"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    data_for_csv = []
    for step, data in sorted_events:
        base_fields = {'timestamp', 'user_id', 'step'}
        additional_fields = sorted(data['fields'] - base_fields)
        data_for_csv.append({
            'イベント': step,
            '出現回数': data['count'],
            '追加フィールド': ', '.join(additional_fields) if additional_fields else '(基本フィールドのみ)'
        })
    
    df = pd.DataFrame(data_for_csv)
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\n✅ CSVを出力しました: {output_file}")

if __name__ == "__main__":
    analyze_log_events()
