#!/usr/bin/env python3
"""
学習効果の深層分析
Q1~Q5の各観点から、ユーザー行動ログとの関連性を分析
"""

import pandas as pd
import json
from datetime import datetime
from collections import defaultdict
import os

def load_enriched_logs(filename='data/logs_enriched.jsonl'):
    """拡張ログを読み込む"""
    logs = []
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                logs.append(json.loads(line))
    return pd.DataFrame(logs)

# ===============================================================
# Q1&Q3: AIの「問い」は機能したか？（テンプレートタイプと気づきの関連）
# ===============================================================

def analyze_q1q3_template_effectiveness(logs):
    """
    分析: どのテンプレートタイプを受け取ったユーザーが
         高い「気づき」スコア（Q1）を得たか
    """
    print("\n" + "=" * 70)
    print("📊 Q1&Q3 分析: AIテンプレートの有効性")
    print("=" * 70)
    
    # AI反応ログを抽出
    ai_feedback = logs[logs['step'] == '🤖_ai_feedback_received'].copy()
    
    if len(ai_feedback) == 0:
        print("❌ AI反応ログがありません")
        return None
    
    # ユーザーごとに集約
    user_template_stats = []
    
    for user_id in logs['user_id'].unique():
        user_logs = logs[logs['user_id'] == user_id]
        user_ai_feedbacks = user_logs[user_logs['step'] == '🤖_ai_feedback_received']
        
        if len(user_ai_feedbacks) == 0:
            continue
        
        # テンプレートタイプの集計
        all_templates = []
        for _, log in user_ai_feedbacks.iterrows():
            templates = log.get('trigger_template_ids', [])
            if isinstance(templates, list):
                all_templates.extend(templates)
        
        template_counts = pd.Series(all_templates).value_counts()
        
        stats = {
            'user_id': user_id,
            'ai_feedback_count': len(user_ai_feedbacks),
            'unique_template_types': len(set(all_templates)),
            'concrete_template_count': sum(1 for t in all_templates if t.startswith('A')),
            'abstract_template_count': sum(1 for t in all_templates if t.startswith('B')),
        }
        
        # テンプレート別の詳細
        for template_id in sorted(set(all_templates)):
            count = sum(1 for t in all_templates if t == template_id)
            stats[f'template_{template_id}'] = count
        
        user_template_stats.append(stats)
    
    df_stats = pd.DataFrame(user_template_stats)
    
    print("\n💡 テンプレート使用統計:")
    print(f"  平均AI反応数: {df_stats['ai_feedback_count'].mean():.1f}回")
    print(f"  平均テンプレットタイプ数: {df_stats['unique_template_types'].mean():.1f}種")
    print(f"  具体化テンプレート(A系)の平均: {df_stats['concrete_template_count'].mean():.1f}回")
    print(f"  抽象化テンプレート(B系)の平均: {df_stats['abstract_template_count'].mean():.1f}回")
    
    # テンプレート別の出現頻度
    print("\n📈 テンプレートタイプの利用頻度:")
    template_cols = [c for c in df_stats.columns if c.startswith('template_')]
    for col in sorted(template_cols):
        total = df_stats[col].sum()
        if total > 0:
            print(f"  {col.upper()}: {int(total)}回 ({total/df_stats['ai_feedback_count'].sum()*100:.1f}%)")
    
    return df_stats

# ===============================================================
# Q2: 内省のプロセスは回っていたか？
# ===============================================================

def analyze_q2_reflection_process(logs):
    """
    分析: 質問への回答 → テキスト修正までの試行錯誤の度合
    仮説: Q2で高スコアを得たユーザーは、複数回試行錯誤している
    """
    print("\n" + "=" * 70)
    print("📊 Q2 分析: 内省プロセスの試行錯誤")
    print("=" * 70)
    
    user_process_stats = []
    
    for user_id in logs['user_id'].unique():
        user_logs = logs[logs['user_id'] == user_id].copy()
        
        # 回答ログを取得
        answer_logs = user_logs[user_logs['step'] == '📝_reflection_saved']
        edit_logs = user_logs[user_logs['step'] == '✏️_text_edited']
        
        if len(answer_logs) == 0:
            continue
        
        # 質問ごとに、回答後の修正回数を集計
        trial_counts = []
        answer_to_edit_times = []
        
        for idx, ans_log in answer_logs.iterrows():
            ans_time = pd.to_datetime(ans_log['timestamp'])
            question_id = ans_log.get('question_id', 'unknown')
            
            # この回答の次の回答の時刻（なければセッション終了）
            subsequent = answer_logs[answer_logs.index > idx]
            if len(subsequent) > 0:
                next_ans_time = pd.to_datetime(subsequent.iloc[0]['timestamp'])
            else:
                next_ans_time = user_logs['timestamp'].max()
            
            # この期間内の修正回数
            edits_in_period = len(edit_logs[
                (pd.to_datetime(edit_logs['timestamp']) > ans_time) &
                (pd.to_datetime(edit_logs['timestamp']) < next_ans_time)
            ])
            
            trial_counts.append(edits_in_period)
            
            # 回答時刻-修正時刻の平均時間差
            edits_after_ans = edit_logs[pd.to_datetime(edit_logs['timestamp']) > ans_time]
            if len(edits_after_ans) > 0:
                edit_times = pd.to_datetime(edits_after_ans['timestamp'])
                time_diffs = [(et - ans_time).total_seconds() for et in edit_times]
                answer_to_edit_times.extend(time_diffs)
        
        stats = {
            'user_id': user_id,
            'total_answers': len(answer_logs),
            'total_edits': len(edit_logs),
            'avg_trials_per_answer': sum(trial_counts) / len(trial_counts) if trial_counts else 0,
            'max_trials_for_single_answer': max(trial_counts) if trial_counts else 0,
            'edits_with_reflection_review': len(answer_logs[answer_logs.get('reviewed_history_before_answer', False) == True]),
        }
        
        user_process_stats.append(stats)
    
    if not user_process_stats:
        print("❌ 反省ログがありません")
        return None
    
    df_process = pd.DataFrame(user_process_stats)
    
    print("\n💭 内省プロセスの統計:")
    print(f"  平均回答数: {df_process['total_answers'].mean():.1f}個")
    print(f"  平均修正数: {df_process['total_edits'].mean():.1f}回")
    print(f"  1回答あたりの平均試行回数: {df_process['avg_trials_per_answer'].mean():.2f}回")
    print(f"  最大試行回数: {df_process['max_trials_for_single_answer'].max():.0f}回")
    
    # 試行回数が多いユーザー vs 少ないユーザーの比較
    high_trial_users = df_process[df_process['avg_trials_per_answer'] >= df_process['avg_trials_per_answer'].median()]
    low_trial_users = df_process[df_process['avg_trials_per_answer'] < df_process['avg_trials_per_answer'].median()]
    
    print(f"\n🔄 高試行グループ（中央値以上）: {len(high_trial_users)}人")
    print(f"   平均試行回数: {high_trial_users['avg_trials_per_answer'].mean():.2f}回")
    
    print(f"\n🔄 低試行グループ（中央値未満）: {len(low_trial_users)}人")
    print(f"   平均試行回数: {low_trial_users['avg_trials_per_answer'].mean():.2f}回")
    
    return df_process

# ===============================================================
# Q4: 視覚的フィードバックは効いたか？
# ===============================================================

def analyze_q4_visual_feedback(logs):
    """
    分析: テキスト修正直後に「元文と比較」（👁️_original_text_toggled）
         または 「履歴を見直す」動作があるか
    仮説: Q4で高スコア（洗練された実感）のユーザーは修正後に確認している
    """
    print("\n" + "=" * 70)
    print("📊 Q4 分析: 視覚的フィードバックの効果")
    print("=" * 70)
    
    user_feedback_stats = []
    
    for user_id in logs['user_id'].unique():
        user_logs = logs[logs['user_id'] == user_id].copy()
        
        edit_logs = user_logs[user_logs['step'] == '✏️_text_edited']
        toggle_logs = user_logs[user_logs['step'] == '👁️_original_text_toggled']
        history_logs = user_logs[user_logs['step'].isin(['📋_session_history_opened', '💭_reflection_history_opened'])]
        
        if len(edit_logs) == 0:
            continue
        
        # 修正後5秒以内に比較を確認したケース
        comparison_checks_after_edit = 0
        delayed_checks = 0
        
        for idx, edit_log in edit_logs.iterrows():
            edit_time = pd.to_datetime(edit_log['timestamp'])
            
            # 次の5秒以内のログをチェック
            subsequent = user_logs[pd.to_datetime(user_logs['timestamp']) > edit_time]
            immediate_checks = subsequent[
                (pd.to_datetime(subsequent['timestamp']) <= edit_time + pd.Timedelta(seconds=5)) &
                (subsequent['step'].isin(['👁️_original_text_toggled', '📋_session_history_opened', '💭_reflection_history_opened']))
            ]
            
            if len(immediate_checks) > 0:
                comparison_checks_after_edit += 1
            
            # 5秒～30秒のタイムラグ
            delayed = subsequent[
                (pd.to_datetime(subsequent['timestamp']) > edit_time + pd.Timedelta(seconds=5)) &
                (pd.to_datetime(subsequent['timestamp']) <= edit_time + pd.Timedelta(seconds=30)) &
                (subsequent['step'].isin(['👁️_original_text_toggled', '📋_session_history_opened', '💭_reflection_history_opened']))
            ]
            
            if len(delayed) > 0:
                delayed_checks += 1
        
        stats = {
            'user_id': user_id,
            'total_edits': len(edit_logs),
            'immediate_confirmations': comparison_checks_after_edit,
            'immediate_confirmation_rate': comparison_checks_after_edit / len(edit_logs) * 100 if len(edit_logs) > 0 else 0,
            'delayed_confirmations': delayed_checks,
            'has_any_feedback_pattern': comparison_checks_after_edit + delayed_checks > 0
        }
        
        user_feedback_stats.append(stats)
    
    if not user_feedback_stats:
        print("❌ 編集ログがありません")
        return None
    
    df_feedback = pd.DataFrame(user_feedback_stats)
    
    print("\n👁️ 視覚的フィードバック確認パターン:")
    print(f"  平均編集数: {df_feedback['total_edits'].mean():.1f}回")
    print(f"  修正直後（5秒以内）の確認率: {df_feedback['immediate_confirmation_rate'].mean():.1f}%")
    print(f"  フィードバックパターンあり: {df_feedback['has_any_feedback_pattern'].sum()}人 / {len(df_feedback)}人")
    
    with_pattern = df_feedback[df_feedback['has_any_feedback_pattern']]
    without_pattern = df_feedback[~df_feedback['has_any_feedback_pattern']]
    
    print(f"\n✅ フィードバック確認ユーザー ({len(with_pattern)}人):")
    print(f"   平均編集数: {with_pattern['total_edits'].mean():.1f}回")
    print(f"   平均即座確認回数: {with_pattern['immediate_confirmations'].mean():.1f}回")
    
    if len(without_pattern) > 0:
        print(f"\n❌ フィードバック確認なしユーザー ({len(without_pattern)}人):")
        print(f"   平均編集数: {without_pattern['total_edits'].mean():.1f}回")
    
    return df_feedback

# ===============================================================
# Q5: 自律化への予兆
# ===============================================================

def analyze_q5_autonomy_development(logs):
    """
    分析: セッション開始前に過去の反省を見て、その後編集しているか
    仮説: Q5で高スコア（自律化）のユーザーは、過去から学んで次に活かしている
    """
    print("\n" + "=" * 70)
    print("📊 Q5 分析: 自律化への予兆")
    print("=" * 70)
    
    user_autonomy_stats = []
    
    for user_id in logs['user_id'].unique():
        user_logs = logs[logs['user_id'] == user_id].copy()
        
        history_reviews = user_logs[user_logs['step'].isin(['💭_reflection_history_opened', '📋_session_history_opened'])]
        edits = user_logs[user_logs['step'] == '✏️_text_edited']
        
        if len(history_reviews) == 0:
            continue
        
        # 過去参照の直後（10分以内）に編集が発生したケース
        autonomy_patterns = 0
        
        for idx, review_log in history_reviews.iterrows():
            review_time = pd.to_datetime(review_log['timestamp'])
            
            # この後の編集をチェック
            subsequent_edits = edits[pd.to_datetime(edits['timestamp']) > review_time]
            
            if len(subsequent_edits) > 0:
                first_edit_time = pd.to_datetime(subsequent_edits.iloc[0]['timestamp'])
                time_diff = (first_edit_time - review_time).total_seconds()
                
                if time_diff < 600:  # 10分以内
                    autonomy_patterns += 1
        
        stats = {
            'user_id': user_id,
            'history_reviews': len(history_reviews),
            'edits_after_review': autonomy_patterns,
            'autonomy_pattern_rate': autonomy_patterns / len(history_reviews) * 100 if len(history_reviews) > 0 else 0,
            'shows_autonomy': autonomy_patterns > 0
        }
        
        user_autonomy_stats.append(stats)
    
    if not user_autonomy_stats:
        print("❌ 履歴参照ログがありません")
        return None
    
    df_autonomy = pd.DataFrame(user_autonomy_stats)
    
    print("\n🎯 自律的学習パターン:")
    print(f"  過去参照をしたユーザー: {(df_autonomy['history_reviews'] > 0).sum()}人")
    print(f"  参照して直後に編集したケース: {df_autonomy['edits_after_review'].sum()}回")
    print(f"  自律パターン発見ユーザー: {df_autonomy['shows_autonomy'].sum()}人 / {len(df_autonomy)}人")
    
    with_autonomy = df_autonomy[df_autonomy['shows_autonomy']]
    without_autonomy = df_autonomy[~df_autonomy['shows_autonomy']]
    
    print(f"\n✅ 自律パターンありユーザー ({len(with_autonomy)}人):")
    print(f"   平均参照回数: {with_autonomy['history_reviews'].mean():.1f}回")
    print(f"   平均参照→編集率: {with_autonomy['autonomy_pattern_rate'].mean():.1f}%")
    
    if len(without_autonomy) > 0:
        print(f"\n❌ 自律パターンなしユーザー ({len(without_autonomy)}人):")
        print(f"   平均参照回数: {without_autonomy['history_reviews'].mean():.1f}回")
    
    return df_autonomy

# ===============================================================
# メイン処理
# ===============================================================

def main():
    print("=" * 70)
    print("🔬 学習効果の深層分析")
    print("=" * 70)
    
    try:
        logs = load_enriched_logs()
        print(f"\n📊 拡張ログを読み込みました: {len(logs)}件")
    except FileNotFoundError:
        print("❌ エラー: data/logs_enriched.jsonl が見つかりません")
        print("先にこちらを実行してください:")
        print("  python3 tools/convert_logs_for_analysis.py")
        return
    
    # 各Q の分析を実行
    df_q1q3 = analyze_q1q3_template_effectiveness(logs)
    df_q2 = analyze_q2_reflection_process(logs)
    df_q4 = analyze_q4_visual_feedback(logs)
    df_q5 = analyze_q5_autonomy_development(logs)
    
    # 統合分析結果をExcelに出力
    output_file = 'results/学習効果_深層分析.xlsx'
    os.makedirs('results', exist_ok=True)
    
    # データフレームが存在するか確認
    has_data = False
    if all(df is not None for df in [df_q1q3, df_q2, df_q4, df_q5]):
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            if df_q1q3 is not None and len(df_q1q3) > 0:
                df_q1q3.to_excel(writer, sheet_name='Q1Q3_テンプレート効果', index=False)
                has_data = True
            if df_q2 is not None and len(df_q2) > 0:
                df_q2.to_excel(writer, sheet_name='Q2_試行錯誤', index=False)
                has_data = True
            if df_q4 is not None and len(df_q4) > 0:
                df_q4.to_excel(writer, sheet_name='Q4_視覚フィードバック', index=False)
                has_data = True
            if df_q5 is not None and len(df_q5) > 0:
                df_q5.to_excel(writer, sheet_name='Q5_自律化予兆', index=False)
                has_data = True
    
    print("\n" + "=" * 70)
    if has_data:
        print("✅ 分析完了")
        print(f"📁 出力ファイル: {output_file}")
    else:
        print("⚠️ 注意: 新しいログを記録してから再度実行してください")
        print("📝 新規ログが記録されると、以下の分析が利用可能になります:")
        print("   • Q1&Q3: AIテンプレートの有効性")
        print("   • Q2: 内省プロセスの試行錯誤")
        print("   • Q4: 視覚的フィードバックの効果")
        print("   • Q5: 自律化への予兆")
    print("=" * 70)

if __name__ == "__main__":
    main()
