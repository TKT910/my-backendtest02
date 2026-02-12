#!/usr/bin/env python3
"""
既存ログを学習効果分析用に拡張・変換するスクリプト
- プロンプトテンプレートタイプを判定
- 質問と回答・修正の時系列マッピング
- 分析用の拡張フィールドを追加
"""

import json
import glob
import os
from datetime import datetime
from collections import defaultdict

# ===== プロンプトテンプレート定義 =====
TEMPLATE_KEYWORDS = {
    'A1': ['数値', '定量', '基準', '範囲', '十分に', 'ある程度', 'かなり', 'わずかに', '多く', '少ない', '頻度'],
    'A2': ['比較', 'より', '対象', '過去', '他群', '平均'],
    'A3': ['影響', '変化', 'つながる', '結果', '変化量'],
    'A4': ['評価', '適切', '妥当', '有効', '望ましい', '重要', '判断', 'どの基準'],
    'A5': ['未来', 'したい', '取り組み', '改善', '行動', '目標', '達成'],
    'A6': ['プロセス', 'どのような手段', '改善', '促進', '強化', '最適化', '深める', '高める'],
    'A7': ['根拠', '理由', 'なぜ', 'どう判断', '背景', '資料'],
    'A8': ['定義', '構成要素', '〇〇とは'],
    'A9': ['論理', 'なぜなら', 'つまり', 'したがって'],
    'B1': ['共通', 'パターン', '羅列', '統合', 'まとめると'],
    'B2': ['分類', '軸', '整理', '範囲', '境界'],
    'B3': ['テーマ', '中心', '核心', '束ねた'],
    'B4': ['経路', '枝分かれ', '多視点'],
    'B5': ['視点', '再検討', '逆転'],
}

def estimate_template_types(questions_preview):
    """質問内容からテンプレートタイプを推定"""
    if not questions_preview or not isinstance(questions_preview, list):
        return []
    
    templates = set()
    all_text = ' '.join(questions_preview).lower()
    
    for template_id, keywords in TEMPLATE_KEYWORDS.items():
        if any(kw in all_text for kw in keywords):
            templates.add(template_id)
    
    return sorted(list(templates))

def load_and_enrich_logs(input_files):
    """
    既存ログを読み込み、拡張情報を付与
    """
    all_logs = []
    session_data = defaultdict(lambda: {'questions': [], 'answers': {}, 'edits': []})
    
    # ステップ1: すべてのログを読み込み
    for filename in sorted(input_files):
        print(f"📄 読み込み中: {os.path.basename(filename)}")
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    log = json.loads(line)
                    all_logs.append(log)
                except json.JSONDecodeError:
                    continue
    
    # ステップ2: ユーザーごと、セッションごとにグループ化（新しい形式に変換）
    enriched_logs = []
    
    for log in all_logs:
        user_id = log.get('user_id')
        step = log.get('step')
        timestamp = log.get('timestamp')
        
        enriched = log.copy()
        
        # ===== AI反応受信 =====
        if step == '🤖_ai_feedback_received':
            # テンプレートタイプを推定
            questions_preview = log.get('questions_preview', [])
            template_types = estimate_template_types(questions_preview)
            
            enriched['trigger_template_ids'] = template_types
            enriched['template_distribution'] = {
                'concrete_count': len([t for t in template_types if t.startswith('A')]),
                'abstract_count': len([t for t in template_types if t.startswith('B')])
            }
        
        # ===== 反省保存 =====
        elif step == '📝_reflection_saved':
            # 質問IDを記録
            enriched['question_id'] = log.get('question_id', 'unknown')
            enriched['answer_length'] = len(log.get('answer', ''))
            
        # ===== テキスト編集 =====
        elif step == '✏️_text_edited':
            enriched['is_after_reflection'] = True
            # 最後の 📝_reflection_saved との時間差を計算するため、準備
            
        # ===== 比較確認 =====
        elif step == '👁️_original_text_toggled':
            enriched['viewing_context_hint'] = 'direct_after_edit'
        
        # ===== 過去参照 =====
        elif step == '💭_reflection_history_opened':
            enriched['context_before_edit'] = True
        
        enriched_logs.append(enriched)
    
    # ステップ3: 時系列で関連ログを識別
    final_logs = []
    
    for i, log in enumerate(enriched_logs):
        user_id = log.get('user_id')
        step = log.get('step')
        timestamp = datetime.fromisoformat(log.get('timestamp', '').replace('Z', '+00:00'))
        
        # 過去ナログを参照してコンテキストを追加
        if step == '📝_reflection_saved':
            # この直前に過去参照があったか
            prev_logs = [l for j, l in enumerate(enriched_logs[:i]) 
                        if l.get('user_id') == user_id and j > max(0, i-5)]
            has_history_review_before = any(
                l.get('step') == '💭_reflection_history_opened' for l in prev_logs[-5:]
            )
            log['reviewed_history_before_answer'] = has_history_review_before
            
            # この直後に修正があるか（5分以内）
            next_logs = [l for j, l in enumerate(enriched_logs[i+1:i+20])
                        if l.get('user_id') == user_id]
            next_edit = None
            for nl in next_logs:
                nt = datetime.fromisoformat(nl.get('timestamp', '').replace('Z', '+00:00'))
                if nl.get('step') == '✏️_text_edited' and (nt - timestamp).total_seconds() < 300:
                    next_edit = nl
                    break
            
            if next_edit:
                next_edit_time = datetime.fromisoformat(next_edit.get('timestamp', '').replace('Z', '+00:00'))
                log['time_to_next_edit_seconds'] = (next_edit_time - timestamp).total_seconds()
            
        elif step == '✏️_text_edited':
            # この直前の反省保存まで遡る
            prev_answer = None
            for plog in reversed(enriched_logs[:i]):
                if plog.get('user_id') == user_id and plog.get('step') == '📝_reflection_saved':
                    prev_answer = plog
                    break
            
            if prev_answer:
                prev_time = datetime.fromisoformat(prev_answer.get('timestamp', '').replace('Z', '+00:00'))
                log['time_since_last_answer_seconds'] = (timestamp - prev_time).total_seconds()
                log['related_question_id'] = prev_answer.get('question_id')
            
            # この直後に比較確認があるか（5秒以内）
            next_logs = [l for j, l in enumerate(enriched_logs[i+1:i+10])
                        if l.get('user_id') == user_id]
            for nl in next_logs:
                nt = datetime.fromisoformat(nl.get('timestamp', '').replace('Z', '+00:00'))
                if nl.get('step') == '👁️_original_text_toggled' and (nt - timestamp).total_seconds() < 5:
                    log['followed_by_comparison_check'] = True
                    break
        
        elif step == '👁️_original_text_toggled':
            # 直前の編集との時間差を計算
            prev_edit = None
            for plog in reversed(enriched_logs[:i]):
                if plog.get('user_id') == user_id and plog.get('step') == '✏️_text_edited':
                    prev_edit = plog
                    break
            
            if prev_edit:
                prev_time = datetime.fromisoformat(prev_edit.get('timestamp', '').replace('Z', '+00:00'))
                log['time_since_last_edit_seconds'] = (timestamp - prev_time).total_seconds()
                log['viewing_context'] = 'after_edit' if (timestamp - prev_time).total_seconds() < 5 else 'delayed'
        
        final_logs.append(log)
    
    return final_logs

def save_enriched_logs(logs, output_file):
    """拡張ログをJSONL形式で保存"""
    with open(output_file, 'w', encoding='utf-8') as f:
        for log in logs:
            f.write(json.dumps(log, ensure_ascii=False) + '\n')

def main():
    print("=" * 70)
    print("📊 ログ拡張・変換スクリプト")
    print("=" * 70 + "\n")
    
    log_files = sorted(glob.glob(os.path.join('logs', '*.jsonl')))
    
    if not log_files:
        print("❌ エラー: logs/フォルダにログファイルが見つかりません")
        return
    
    # ログを拡張
    enriched_logs = load_and_enrich_logs(log_files)
    
    # 保存
    output_file = 'data/logs_enriched.jsonl'
    os.makedirs('data', exist_ok=True)
    save_enriched_logs(enriched_logs, output_file)
    
    # 統計出力
    ai_feedbacks = [l for l in enriched_logs if l.get('step') == '🤖_ai_feedback_received']
    template_counter = defaultdict(int)
    
    for log in ai_feedbacks:
        for template_id in log.get('trigger_template_ids', []):
            template_counter[template_id] += 1
    
    print(f"\n✅ 拡張ログを保存しました")
    print(f"📁 出力ファイル: {output_file}")
    print(f"📊 総ログ件数: {len(enriched_logs)}")
    print(f"🤖 AI反応数: {len(ai_feedbacks)}")
    print(f"\n📈 テンプレートタイプの分布:")
    
    for template_id in sorted(template_counter.keys()):
        count = template_counter[template_id]
        print(f"  {template_id}: {count}回")
    
    print("\n💡 次のステップ:")
    print("  1. python3 tools/analyze_learning_effectiveness.py")
    print("     → 学習効果の深層分析を実行")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
