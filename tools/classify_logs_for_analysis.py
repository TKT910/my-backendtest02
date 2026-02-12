#!/usr/bin/env python3
"""
ログイベントの分類：Q1~Q5分析に向けて「必要」「不要」を分析
"""

import json
from pathlib import Path
import pandas as pd

def classify_log_events():
    """ログイベントをQ1~Q5分析に基づいて分類"""
    
    print("📊 Q1~Q5分析に向けたログイベント分類\n")
    print("="*90)
    
    # 必要なログの分類
    analysis_requirements = {
        "Q1&Q3: テンプレートタイプ推論（AI質問の種類 vs 気づき）": {
            "essential": [
                ("🤖_ai_feedback_received", "テンプレートタイプ配列（A1-A9, B1-B5）を含む現在形式"),
            ],
            "supplementary": [
                ("質問テキスト全体", "質問の内容を分析する際に参照"),
            ],
            "note": "template_types配列が最も重要"
        },
        "Q2: 回答→編集試行数（反省の深さの代理指標）": {
            "essential": [
                ("text_revised", "ユーザーが回答を編集した事実"),
                ("回答保存イベント", "【現在未実装】回答を初めて入力した時点の記録が必要"),
            ],
            "supplementary": [
                ("focused_question_id", "どの質問に対する編集か特定するため"),
            ],
            "note": "edit_answer_saved など新しいイベント実装が必要"
        },
        "Q4: 編集→比較チェック（修正感の確認）": {
            "essential": [
                ("text_revised", "編集が発生した時刻と内容"),
                ("toggle_original_view", "元文を見た時刻（showing_original=trueの時点）"),
            ],
            "supplementary": [
                ("timestamp", "編集と確認チェックのペアを時間でマッチング（5秒以内）"),
            ],
            "note": "時系列で両者が5秒以内にペアになっているかを確認"
        },
        "Q5: 履歴確認→編集（自律性発達の代理指標）": {
            "essential": [
                ("📋_session_history_opened or 💭_reflection_history_opened", "ユーザーが過去セッション/反省を見た"),
                ("text_revised", "その後、テキストを編集した"),
            ],
            "supplementary": [
                ("timestamp", "履歴確認と編集の時間差（10分以内）"),
            ],
            "note": "過去学習を参照してから編集するまでの時間を測定"
        }
    }
    
    # 各カテゴリを表示
    for q_analysis, requirements in analysis_requirements.items():
        print(f"\n🎯 {q_analysis}")
        print(f"   {'─'*85}")
        
        print(f"   ⭕ 不可欠（必須）:")
        for event, desc in requirements["essential"]:
            status = "✅ 実装済" if "現在" not in desc else "❌ 未実装"
            print(f"      {status} {event}")
            print(f"         └─ {desc}")
        
        if requirements["supplementary"]:
            print(f"\n   🟡 補助的（あると便利）:")
            for event, desc in requirements["supplementary"]:
                print(f"      • {event}")
                print(f"         └─ {desc}")
        
        if requirements["note"]:
            print(f"\n   📝 注記: {requirements['note']}")
    
    print("\n" + "="*90)
    print("\n❌ 分析に不要なログイベント（削除候補）\n")
    
    unnecessary = [
        ("click_help_btn, click_help_from_login", "ヘルプ閲覧は学習効果の分析対象外"),
        ("click_new_session_btn", "新規セッション開始は純粋なUI操作"),
        ("click_cancel_text_input", "キャンセル操作はエラー状態を示す"),
        ("submit_initial_text", "テキスト初期送信は不要（🤖_ai_feedback_receivedで追跡可）"),
        ("mode_select_text（古い形式）", "新形式📁_file_input_mode_selectedに統一予定"),
        ("ai_feedback_generated（古い形式）", "新形式🤖_ai_feedback_receivedで置き換わった"),
        ("login_success", "セッション内分析が主なため、ログイン時刻は補助的"),
        ("page_loaded_with_user, 🌐_page_loaded", "ページロード自体は学習行動ではない"),
    ]
    
    for event, reason in unnecessary:
        print(f"   ❌ {event}")
        print(f"      └─ {reason}\n")
    
    print("="*90)
    print("\n🔧 実装支援\n")
    
    missing_implementation = [
        {
            "name": "edit_answer_saved（新規）",
            "trigger": "ユーザーが質問への回答を初めて送信・保存した時",
            "fields": ["question_id", "answer_text", "answer_length"],
            "purpose": "Q2分析で「初答→編集」までの試行数をカウント"
        }
    ]
    
    for impl in missing_implementation:
        print(f"   📌 {impl['name']}")
        print(f"      トリガー: {impl['trigger']}")
        print(f"      記録フィールド: {', '.join(impl['fields'])}")
        print(f"      目的: {impl['purpose']}\n")
    
    # サマリーCSV出力
    summary_data = []
    
    for q_analysis, requirements in analysis_requirements.items():
        for event, desc in requirements["essential"]:
            summary_data.append({
                "分析": q_analysis.split(":")[0],
                "必須度": "⭕ 必須",
                "イベント": event,
                "説明": desc,
                "実装状況": "✅ 有" if "未実装" not in desc else "❌ 無"
            })
    
    for event, reason in unnecessary:
        summary_data.append({
            "分析": "（全体）",
            "必須度": "❌ 不要",
            "イベント": event,
            "説明": reason,
            "実装状況": "✅ 有"
        })
    
    df = pd.DataFrame(summary_data)
    output_file = Path(__file__).parent.parent / "results" / "log_classification_for_analysis.csv"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    
    print(f"✅ 詳細をCSVで出力: {output_file}\n")

if __name__ == "__main__":
    classify_log_events()
