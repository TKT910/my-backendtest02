# 📋 ログイベント（step）リファレンス

**更新日:** 2026年2月10日  
**総ログ件数:** 89  
**ユーザー数:** 2

## 📌 イベント一覧

| イベント | 回数 | 割合 | 説明 |
|---------|------|------|------|
| `click_history_btn` | 22 | 24.7% | 📋 セッション履歴を表示（🕒履歴） |
| `restore_history_session` | 15 | 16.9% | 🔄 セッションを復元 |
| `click_reflection_history_btn` | 12 | 13.5% | 💭 反省履歴を表示（💭内省履歴） |
| `page_loaded_with_user` | 10 | 11.2% | 🌐 ページが読み込まれた |
| `text_revised` | 8 | 9.0% | ✏️ テキストが編集された |
| `ai_feedback_generated` | 6 | 6.7% | 🤖 AIが質問を生成 |
| `login_success` | 5 | 5.6% | ✅ ユーザーがログイン完了 |
| `mode_select_text` | 4 | 4.5% | 📝 テキスト入力モード選択 |
| `click_new_session_btn` | 2 | 2.2% | ✨ 新しいセッションを開始 |
| `click_help_btn` | 1 | 1.1% | ❓ ヘルプを表示 |
| `click_help_from_login` | 1 | 1.1% | ❓ ログイン画面でヘルプ表示 |
| `toggle_original_view` | 1 | 1.1% | 👁️ 元文表示を切り替え |
| `click_cancel_text_input` | 1 | 1.1% | ❌ テキスト入力キャンセル |
| `submit_initial_text` | 1 | 1.1% | 📤 初期テキスト送信 |

## 🎯 イベントフロー例

### セッション開始～反省保存の典型フロー

```
✅_user_login_completed
  ↓ ログイン
📝_text_input_mode_selected
  ↓ テキスト入力モード選択
📤_initial_text_submitted
  ↓ テキスト送信
🤖_ai_feedback_received
  ↓ AI質問生成
📝_reflection_saved (繰り返し)
  ↓ 反省を記述
✏️_text_edited (複数回)
  ↓ テキスト修正
👁️_original_text_toggled
  ↓ 元文を確認（修正効果の確認）
💭_reflection_history_opened
  ↓ 過去の反省を参照（次回に活かす）
```

## 🏷️ イベントカテゴリ別分類

### ログイン・ページ関連
- `✅_user_login_completed` - ログイン完了
- `🌐_page_loaded` - ページ読み込み

### テキスト入力・編集
- `📝_text_input_mode_selected` - テキスト入力選択
- `📄_file_input_mode_selected` - ファイル入力選択
- `📤_initial_text_submitted` - テキスト送信
- `✏️_text_edited` - テキスト修正
- `👁️_original_text_toggled` - 元文表示切替

### AI・質問生成
- `🤖_ai_feedback_received` - AI質問生成

### 反省機能
- `📝_reflection_saved` - 反省保存
- `💭_reflection_history_opened` - 反省履歴表示

### セッション管理
- `✨_new_session_started` - 新規セッション
- `📋_session_history_opened` - セッション履歴表示
- `🔄_session_restored` - セッション復元
- `🗑️_clear_history_opened` - 履歴削除開始
- `🗑️_all_history_cleared` - 全履歴削除

### その他
- `📊_summary_opened` - サマリー表示
- `❓_help_opened` - ヘルプ表示
- `💾_save_word_opened` - Word保存

## 📊 ユーザー別分析

**分析対象ユーザー:** 2人

### AAA23179
- 総イベント数: 83
- 主要イベント:
  - `click_history_btn`: 21回
  - `restore_history_session`: 15回
  - `click_reflection_history_btn`: 12回
  - `page_loaded_with_user`: 10回
  - `text_revised`: 8回

### guest
- 総イベント数: 6
- 主要イベント:
  - `ai_feedback_generated`: 4回
  - `click_help_from_login`: 1回
  - `click_history_btn`: 1回

