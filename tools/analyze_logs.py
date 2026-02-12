#!/usr/bin/env python3
"""
ログ分析ツール - より直感的で詳細な集計機能付き
JSON Lines形式のログを複数の視点で分析し、Excel/CSV出力する
"""

import pandas as pd
import json
import glob
import os
from datetime import datetime
from collections import Counter, defaultdict

# 設定
LOG_DIR = "logs"
OUTPUT_XLSX = "ログ分析_詳細.xlsx"
OUTPUT_CSV_SUMMARY = "ログ分析_サマリー.csv"

def load_logs():
    """すべてのJSONLログファイルを読み込む"""
    log_files = sorted(glob.glob(os.path.join(LOG_DIR, "*.jsonl")))
    
    if not log_files:
        print(f"❌ エラー: '{LOG_DIR}' フォルダにログファイルが見つかりません。")
        return []
    
    all_data = []
    print(f"📂 {len(log_files)} 個のログファイルを処理中...\n")
    
    for filename in log_files:
        print(f"  📄 読み込み中: {os.path.basename(filename)}")
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    # リスト型の中身は文字列に変換（Excel対応）
                    for key, value in data.items():
                        if isinstance(value, (list, dict)):
                            data[key] = str(value)
                    all_data.append(data)
                except json.JSONDecodeError:
                    continue
    
    return all_data

def create_base_df(all_data):
    """基本データフレームを作成"""
    df = pd.DataFrame(all_data)
    
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values(by=['user_id', 'timestamp']).reset_index(drop=True)
    
    return df

def create_summary_sheet(df):
    """📊 サマリーシート：全体統計"""
    summary_data = {
        '📊 指標': [
            '✅ 総ログ件数',
            '👥 ユーザー数',
            '📅 ログ期間（開始）',
            '📅 ログ期間（終了）',
            '📱 ログイン成功回数',
            '🔄 セッション復元回数',
            '💾 反省履歴閲覧回数',
            '🕒 一般履歴閲覧回数'
        ],
        '値': [
            len(df),
            df['user_id'].nunique(),
            df['timestamp'].min().strftime('%Y-%m-%d %H:%M:%S'),
            df['timestamp'].max().strftime('%Y-%m-%d %H:%M:%S'),
            len(df[df['step'] == 'login_success']),
            len(df[df['step'] == 'restore_history_session']),
            len(df[df['step'] == 'click_reflection_history_btn']),
            len(df[df['step'] == 'click_history_btn'])
        ]
    }
    return pd.DataFrame(summary_data)

def create_event_stats_sheet(df):
    """📈 イベント統計シート：各行動の発生回数"""
    event_counts = df['step'].value_counts().reset_index()
    event_counts.columns = ['📌 行動イベント', '🔢 発生回数']
    event_counts['📊 割合（%）'] = (event_counts['🔢 発生回数'] / len(df) * 100).round(2)
    return event_counts.sort_values('🔢 発生回数', ascending=False)

def create_user_activity_sheet(df):
    """👥 ユーザー活動シート：ユーザーごとの活動"""
    user_data = []
    for user_id in df['user_id'].unique():
        user_logs = df[df['user_id'] == user_id]
        user_data.append({
            '👤 ユーザーID': user_id,
            '📊 行動回数': len(user_logs),
            '📅 初回アクセス': user_logs['timestamp'].min().strftime('%Y-%m-%d %H:%M:%S'),
            '📅 最終アクセス': user_logs['timestamp'].max().strftime('%Y-%m-%d %H:%M:%S'),
            '⏱️ 活動時間幅': str(user_logs['timestamp'].max() - user_logs['timestamp'].min()).split('.')[0],
            '✅ ログイン': len(user_logs[user_logs['step'] == 'login_success']),
            '💾 反省閲覧': len(user_logs[user_logs['step'] == 'click_reflection_history_btn']),
            '🕒 履歴閲覧': len(user_logs[user_logs['step'] == 'click_history_btn']),
            '🔄 復元': len(user_logs[user_logs['step'] == 'restore_history_session']),
            '💾 保存': len(user_logs[user_logs['step'].str.contains('save', na=False)])
        })
    
    return pd.DataFrame(user_data).sort_values('📊 行動回数', ascending=False)

def create_hourly_timeline_sheet(df):
    """⏰ 時間別タイムライン：時間帯ごとの行動分布"""
    df_copy = df.copy()
    df_copy['🕐 時間'] = df_copy['timestamp'].dt.strftime('%H:00')
    df_copy['📅 日付'] = df_copy['timestamp'].dt.strftime('%Y-%m-%d')
    
    timeline = df_copy.groupby(['📅 日付', '🕐 時間']).size().reset_index(name='🔢 件数')
    timeline = timeline.sort_values(['📅 日付', '🕐 時間'])
    
    return timeline

def create_session_flow_sheet(df):
    """🔄 セッション流：重要な行動フロー"""
    important_steps = ['login_success', 'click_reflection_history_btn', 'click_history_btn', 
                       'restore_history_session', 'save_individual_answer', 'save_answers']
    
    flow_data = []
    for user_id in df['user_id'].unique():
        user_logs = df[(df['user_id'] == user_id) & (df['step'].isin(important_steps))]
        if len(user_logs) > 0:
            flow_str = ' → '.join(user_logs['step'].tolist())
            flow_data.append({
                '👤 ユーザーID': user_id,
                '🔄 行動フロー': flow_str,
                '🔢 ステップ数': len(user_logs)
            })
    
    return pd.DataFrame(flow_data)

def create_event_sequence_sheet(df):
    """📝 イベント詳細：タイムスタンプ付き完全ログ"""
    df_output = df.copy()
    df_output['⏰ 時刻'] = df_output['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S.%f').str[:-3]
    df_output['👤 ユーザー'] = df_output['user_id']
    df_output['📌 イベント'] = df_output['step']
    
    # その他のカラムで有用な情報を統合
    df_output['📊 詳細'] = ''
    for idx in df_output.index:
        details = []
        for col in ['session_id', 'preview', 'question_text', 'data']:
            if col in df.columns and pd.notna(df_output.loc[idx, col]):
                val = str(df_output.loc[idx, col])[:50]  # 50文字まで
                details.append(f"{col}: {val}...")
        df_output.loc[idx, '📊 詳細'] = ' | '.join(details) if details else '(データなし)'
    
    return df_output[['⏰ 時刻', '👤 ユーザー', '📌 イベント', '📊 詳細']].reset_index(drop=True)

def create_summary_csv(df):
    """📄 シンプルなCSV出力：ワンライナー集計"""
    summaries = []
    
    # 全体統計
    summaries.append(['=== 📊 全体統計 ==='])
    summaries.append([f'ログ件数', len(df)])
    summaries.append([f'ユーザー数', df['user_id'].nunique()])
    summaries.append([''])
    
    # ユーザー別統計
    summaries.append(['=== 👥 ユーザー別統計 ==='])
    summaries.append(['ユーザーID', '行動数', 'ログイン', '反省閲覧', '履歴閲覧', '復元'])
    for user_id in sorted(df['user_id'].unique()):
        user_logs = df[df['user_id'] == user_id]
        summaries.append([
            user_id,
            len(user_logs),
            len(user_logs[user_logs['step'] == 'login_success']),
            len(user_logs[user_logs['step'] == 'click_reflection_history_btn']),
            len(user_logs[user_logs['step'] == 'click_history_btn']),
            len(user_logs[user_logs['step'] == 'restore_history_session'])
        ])
    
    summaries.append([''])
    summaries.append(['=== 📈 イベント統計 ==='])
    summaries.append(['イベント', '発生回数', '割合'])
    for step, count in df['step'].value_counts().items():
        pct = count / len(df) * 100
        summaries.append([step, count, f'{pct:.1f}%'])
    
    summary_df = pd.DataFrame(summaries)
    return summary_df

def main():
    print("=" * 60)
    print("🔍 ログ分析ツール v2 - 直感的な可視化版")
    print("=" * 60 + "\n")
    
    # ログ読み込み
    all_data = load_logs()
    if not all_data:
        return
    
    print(f"✅ {len(all_data)} 件のログを読み込みました\n")
    
    # 基本データフレーム作成
    df = create_base_df(all_data)
    
    # 各シートを生成
    sheets = {
        '📊 概要': create_summary_sheet(df),
        '📈 イベント統計': create_event_stats_sheet(df),
        '👥 ユーザー活動': create_user_activity_sheet(df),
        '⏰ 時間別タイムライン': create_hourly_timeline_sheet(df),
        '🔄 セッションフロー': create_session_flow_sheet(df),
        '📝 イベント詳細': create_event_sequence_sheet(df)
    }
    
    # Excel出力（複数シート）
    print(f"📁 Excel出力中...\n")
    with pd.ExcelWriter(OUTPUT_XLSX, engine='openpyxl') as writer:
        for sheet_name, sheet_df in sheets.items():
            print(f"  ✏️  {sheet_name} ({len(sheet_df)} 行)")
            sheet_df.to_excel(writer, sheet_name=sheet_name, index=False)
    
    # CSV出力（シンプル集計）
    print(f"\n📄 CSV出力中...")
    summary_csv = create_summary_csv(df)
    summary_csv.to_csv(OUTPUT_CSV_SUMMARY, index=False, encoding='utf-8-sig')
    
    print("\n" + "=" * 60)
    print("✅ 分析完了！")
    print("-" * 60)
    print(f"📊 Excel詳細分析: {OUTPUT_XLSX}")
    print(f"   - 📊 概要: 全体統計")
    print(f"   - 📈 イベント統計: イベント別の発生回数")
    print(f"   - 👥 ユーザー活動: ユーザーごとの行動分析")
    print(f"   - ⏰ 時間別タイムライン: 時間帯ごとの分布")
    print(f"   - 🔄 セッションフロー: 行動パターン")
    print(f"   - 📝 イベント詳細: 完全なタイムスタンプ付きログ")
    print()
    print(f"📄 CSV簡易集計: {OUTPUT_CSV_SUMMARY}")
    print("=" * 60)

if __name__ == "__main__":
    main()
