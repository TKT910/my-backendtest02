#!/usr/bin/env python3
"""
ログstep一覧の可視化
現在ツールで記録されているすべてのイベントタイプを整理表示
"""

import json
import glob
import pandas as pd
from collections import Counter
import os

# ===== step の説明マッピング =====
STEP_DESCRIPTIONS = {
    # ===== 新形式（絵文字付き） =====
    # ログイン・ページ読み込み
    '✅_user_login_completed': 'ユーザーがログイン完了',
    '🌐_page_loaded': 'ページが読み込まれた',
    
    # テキスト入力
    '📝_text_input_mode_selected': 'テキスト入力モード選択',
    '📄_file_input_mode_selected': 'ファイル入力モード選択',
    '📤_initial_text_submitted': '初期テキスト送信',
    '❌_text_input_cancelled': 'テキスト入力キャンセル',
    
    # テキスト表示・編集
    '✏️_text_edited': 'テキストが編集された',
    '👁️_original_text_toggled': '元文表示を切り替え',
    
    # セッション管理
    '✨_new_session_started': '新しいセッションを開始',
    '📋_session_history_opened': 'セッション履歴を表示（🕒履歴）',
    '🔄_session_restored': 'セッションを復元',
    
    # 気づき・反省
    '💭_reflection_history_opened': '反省履歴を表示（💭内省履歴）',
    '📝_reflection_saved': '反省内容を保存',
    
    # 履歴削除
    '🗑️_clear_history_opened': '履歴削除を開始',
    '🗑️_all_history_cleared': 'すべての履歴を削除',
    '❌_history_item_deleted': '個別の履歴を削除',
    
    # AI機能
    '🤖_ai_feedback_received': 'AIが質問を生成',
    '🤖_ai_feedback_received': 'AI フィードバック受信',
    
    # サマリー・ヘルプ
    '📊_summary_opened': 'サマリーを表示',
    '❓_help_opened': 'ヘルプを表示',
    '❓_help_opened_on_login': 'ログイン画面でヘルプ表示',
    
    # ファイル操作
    '💾_save_word_opened': 'Word保存画面を開く',
    '💾_word_file_saved': 'Wordファイルをダウンロード',
    
    # ===== 旧形式（テキストのみ）=====
    'login_success': '✅ ユーザーがログイン完了',
    'page_loaded_with_user': '🌐 ページが読み込まれた',
    
    'mode_select_text': '📝 テキスト入力モード選択',
    'mode_select_file': '📄 ファイル入力モード選択',
    'submit_initial_text': '📤 初期テキスト送信',
    'click_cancel_text_input': '❌ テキスト入力キャンセル',
    
    'text_revised': '✏️ テキストが編集された',
    'toggle_original_view': '👁️ 元文表示を切り替え',
    
    'click_new_session_btn': '✨ 新しいセッションを開始',
    'click_history_btn': '📋 セッション履歴を表示（🕒履歴）',
    'restore_history_session': '🔄 セッションを復元',
    
    'click_reflection_history_btn': '💭 反省履歴を表示（💭内省履歴）',
    'save_individual_answer': '📝 反省内容を保存',
    
    'click_clear_history_btn': '🗑️ 履歴削除を開始',
    'execute_clear_all_history': '🗑️ すべての履歴を削除',
    'delete_single_history': '❌ 個別の履歴を削除',
    
    'ai_feedback_generated': '🤖 AIが質問を生成',
    
    'click_show_summary': '📊 サマリーを表示',
    'click_help_btn': '❓ ヘルプを表示',
    'click_help_from_login': '❓ ログイン画面でヘルプ表示',
    
    'click_save_word_btn': '💾 Word保存画面を開く',
    'execute_save_word': '💾 Wordファイルをダウンロード',
}

def load_all_logs():
    """すべてのログファイルを読み込み"""
    logs = []
    log_files = sorted(glob.glob('logs/*.jsonl'))
    
    for filename in log_files:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        logs.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    
    return logs

def main():
    print("=" * 80)
    print("📊 ツール内で記録されているログ（events）一覧")
    print("=" * 80 + "\n")
    
    # ログを読み込み
    logs = load_all_logs()
    
    if not logs:
        print("❌ ログが見つかりません")
        return
    
    # stepを集計
    step_counts = Counter([log.get('step') for log in logs])
    
    # データフレーム化
    df = pd.DataFrame([
        {
            '📌 イベント (step)': step,
            '🔢 発生回数': count,
            '📊 割合': f'{count / len(logs) * 100:.1f}%',
            '📝 説明': STEP_DESCRIPTIONS.get(step, '(説明未定義)')
        }
        for step, count in step_counts.most_common()
    ])
    
    # 画面に表示
    print("📌 イベント一覧（発生回数の多い順）:\n")
    print(df.to_string(index=False))
    
    print("\n" + "=" * 80)
    print(f"📊 統計:")
    print(f"   総ログ件数: {len(logs)}")
    print(f"   ユーザー数: {len(set(log.get('user_id') for log in logs))}")
    print(f"   イベントタイプ数: {len(step_counts)}")
    print("=" * 80)
    
    # Excel出力
    output_file = 'results/ログイベント一覧.xlsx'
    os.makedirs('results', exist_ok=True)
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='イベント一覧', index=False)
        
        # 詳細シート：ユーザーごとのイベント分布
        user_events = {}
        for log in logs:
            user_id = log.get('user_id')
            step = log.get('step')
            if user_id not in user_events:
                user_events[user_id] = {}
            user_events[user_id][step] = user_events[user_id].get(step, 0) + 1
        
        df_user = pd.DataFrame([
            {
                '👤 ユーザー': user_id,
                '📊 イベント数': sum(events.values()),
                **{f'{step}': events.get(step, 0) for step, _ in step_counts.most_common(10)}
            }
            for user_id, events in user_events.items()
        ])
        
        df_user.to_excel(writer, sheet_name='ユーザー別イベント', index=False)
    
    print(f"\n✅ 詳細をExcelに出力しました: {output_file}")
    
    # マークダウン形式でも出力
    output_md = 'tools/LOG_EVENTS_REFERENCE.md'
    
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write("# 📋 ログイベント（step）リファレンス\n\n")
        f.write(f"**更新日:** 2026年2月10日  \n")
        f.write(f"**総ログ件数:** {len(logs)}  \n")
        f.write(f"**ユーザー数:** {len(set(log.get('user_id') for log in logs))}\n\n")
        
        f.write("## 📌 イベント一覧\n\n")
        f.write("| イベント | 回数 | 割合 | 説明 |\n")
        f.write("|---------|------|------|------|\n")
        
        for _, row in df.iterrows():
            event = row['📌 イベント (step)']
            count = row['🔢 発生回数']
            pct = row['📊 割合']
            desc = row['📝 説明']
            f.write(f"| `{event}` | {count} | {pct} | {desc} |\n")
        
        f.write("\n## 🎯 イベントフロー例\n\n")
        f.write("### セッション開始～反省保存の典型フロー\n\n")
        f.write("```\n")
        f.write("✅_user_login_completed\n")
        f.write("  ↓ ログイン\n")
        f.write("📝_text_input_mode_selected\n")
        f.write("  ↓ テキスト入力モード選択\n")
        f.write("📤_initial_text_submitted\n")
        f.write("  ↓ テキスト送信\n")
        f.write("🤖_ai_feedback_received\n")
        f.write("  ↓ AI質問生成\n")
        f.write("📝_reflection_saved (繰り返し)\n")
        f.write("  ↓ 反省を記述\n")
        f.write("✏️_text_edited (複数回)\n")
        f.write("  ↓ テキスト修正\n")
        f.write("👁️_original_text_toggled\n")
        f.write("  ↓ 元文を確認（修正効果の確認）\n")
        f.write("💭_reflection_history_opened\n")
        f.write("  ↓ 過去の反省を参照（次回に活かす）\n")
        f.write("```\n\n")
        
        f.write("## 🏷️ イベントカテゴリ別分類\n\n")
        f.write("### ログイン・ページ関連\n")
        f.write("- `✅_user_login_completed` - ログイン完了\n")
        f.write("- `🌐_page_loaded` - ページ読み込み\n\n")
        
        f.write("### テキスト入力・編集\n")
        f.write("- `📝_text_input_mode_selected` - テキスト入力選択\n")
        f.write("- `📄_file_input_mode_selected` - ファイル入力選択\n")
        f.write("- `📤_initial_text_submitted` - テキスト送信\n")
        f.write("- `✏️_text_edited` - テキスト修正\n")
        f.write("- `👁️_original_text_toggled` - 元文表示切替\n\n")
        
        f.write("### AI・質問生成\n")
        f.write("- `🤖_ai_feedback_received` - AI質問生成\n\n")
        
        f.write("### 反省機能\n")
        f.write("- `📝_reflection_saved` - 反省保存\n")
        f.write("- `💭_reflection_history_opened` - 反省履歴表示\n\n")
        
        f.write("### セッション管理\n")
        f.write("- `✨_new_session_started` - 新規セッション\n")
        f.write("- `📋_session_history_opened` - セッション履歴表示\n")
        f.write("- `🔄_session_restored` - セッション復元\n")
        f.write("- `🗑️_clear_history_opened` - 履歴削除開始\n")
        f.write("- `🗑️_all_history_cleared` - 全履歴削除\n\n")
        
        f.write("### その他\n")
        f.write("- `📊_summary_opened` - サマリー表示\n")
        f.write("- `❓_help_opened` - ヘルプ表示\n")
        f.write("- `💾_save_word_opened` - Word保存\n\n")
        
        f.write("## 📊 ユーザー別分析\n\n")
        f.write(f"**分析対象ユーザー:** {len(user_events)}人\n\n")
        
        for user_id, events in sorted(user_events.items(), key=lambda x: sum(x[1].values()), reverse=True):
            total = sum(events.values())
            f.write(f"### {user_id}\n")
            f.write(f"- 総イベント数: {total}\n")
            f.write(f"- 主要イベント:\n")
            for step, count in sorted(events.items(), key=lambda x: x[1], reverse=True)[:5]:
                f.write(f"  - `{step}`: {count}回\n")
            f.write("\n")
    
    print(f"✅ マークダウン形式でも出力: {output_md}")
    print("=" * 80)

if __name__ == "__main__":
    main()
