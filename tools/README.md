# 📊 ログ分析ツール ガイド

## 概要

このディレクトリには、アプリケーションのログを分析・可視化するツールが含まれています。

### 📁 ファイル一覧

| ファイル | 説明 | 用途 |
|---------|------|------|
| `analyze_logs.py` | **推奨** - 詳細分析ツール | ユーザー行動、時間別分布、イベント統計など多角的に分析 |
| `convert_logs.py` | シンプル変換ツール | JSONLをそのままExcelに変換（基本的なデータテーブル） |

---

## 🚀 使い方

### 前提条件

```bash
# Python依存パッケージをインストール
pip install pandas openpyxl
```

### 1️⃣ 詳細分析（推奨）

```bash
python3 tools/analyze_logs.py
```

**生成ファイル:**
- `ログ分析_詳細.xlsx` - Excel形式（複数シート）
- `ログ分析_サマリー.csv` - CSV形式（簡潔統計）

**Excel内容（6つのシート）:**

| シート名 | 内容 |
|---------|------|
| 📊 **概要** | 全体統計（ログ件数、ユーザー数、期間など） |
| 📈 **イベント統計** | 各イベントの発生回数・割合 |
| 👥 **ユーザー活動** | ユーザーごとの行動詳細（ログイン回数、閲覧回数など） |
| ⏰ **時間別タイムライン** | 時間帯ごとの行動分布（何時に何件発生したか） |
| 🔄 **セッションフロー** | ユーザーの行動パターン（どの順序で行動したか） |
| 📝 **イベント詳細** | 完全なタイムスタンプ付きログ |

### 2️⃣ シンプル変換（基本的なExcel変換）

```bash
python3 tools/convert_logs.py
```

**生成ファイル:**
- `experiment_data_summary.xlsx` - 全ログデータをテーブル形式で表示

---

## 📊 出力例

### Excel 概要シート

```
指標                  値
✅ 総ログ件数         89 件
👥 ユーザー数         2 人
📅 ログ期間(開始)     2025-12-10 18:30:32
📅 ログ期間(終了)     2026-02-09 20:50:04
📱 ログイン成功       5 回
🔄 セッション復元     4 回
💾 反省履歴閲覧       15 回
🕒 一般履歴閲覧       10 回
```

### Excel ユーザー活動シート

```
ユーザーID  行動数  ログイン  反省閲覧  履歴閲覧  復元
AAA23179    85     5        14       9        4
guest       4      1        1        1        0
```

### CSV サマリー

```
=== 全体統計 ===
ログ件数, 89
ユーザー数, 2

=== ユーザー別統計 ===
ユーザーID, 行動数, ログイン, 反省閲覧, 履歴閲覧, 復元
AAA23179, 85, 5, 14, 9, 4
guest, 4, 1, 1, 1, 0

=== イベント統計 ===
イベント, 発生回数, 割合
click_reflection_history_btn, 15, 16.9%
click_history_btn, 10, 11.2%
restore_history_session, 4, 4.5%
...
```

---

## 🎯 ユースケース

### 📌 Q1: ユーザーはシステムをどう使っているか？
**→ 👥 ユーザー活動シートを確認**
- 各ユーザーの行動数、ログイン回数、機能利用状況が一目瞭然

### 📌 Q2: どのイベントが最も頻繁に発生しているか？
**→ 📈 イベント統計シートを確認**
- イベント別の発生頻度と割合をランキング表示

### 📌 Q3: いつ？どこで？何が起こったか？
**→ 📝 イベント詳細シートを確認**
- 時系列で完全なタイムスタンプ付きログを表示

### 📌 Q4: ユーザーの行動パターンは？
**→ 🔄 セッションフローシートを確認**
- どのユーザーがどの操作を連続して行ったかがわかる

### 📌 Q5: 時間帯ごとの利用状況は？
**→ ⏰ 時間別タイムラインシートを確認**
- 何時に最もシステムが使われたか

---

## 💡 Tips

### 💻 自動実行（毎日/毎週）

#### macOS/Linux

```bash
# cronで毎日実行
0 2 * * * cd /path/to/project && python3 tools/analyze_logs.py >> logs/analysis.log 2>&1
```

#### Windows

PowerShellでタスクスケジューラを使用

```powershell
$action = New-ScheduledTaskAction -Execute 'python3' -Argument 'tools/analyze_logs.py'
Register-ScheduledTask -TaskName "DailyLogAnalysis" -Action $action -Trigger (New-ScheduledTaskTrigger -Daily -At 2am)
```

### 🔄 ツール連携

```bash
# シンプル版で変換してから、詳細分析をする場合
python3 tools/convert_logs.py && python3 tools/analyze_logs.py
```

---

## 🔧 カスタマイズ

### 特定ユーザーのみ分析したい場合

`analyze_logs.py` の以下部分を修正：

```python
# 例: ユーザー 'AAA23179' のみ分析
df = df[df['user_id'] == 'AAA23179']
```

### 特定期間のみ分析したい場合

```python
# 例: 2026年2月のみ
df = df[df['timestamp'].dt.month == 2]
df = df[df['timestamp'].dt.year == 2026]
```

---

## 📞 トラブルシューティング

### ❌ エラー: `ModuleNotFoundError: No module named 'pandas'`

```bash
pip install pandas openpyxl
```

### ❌ エラー: ログファイルが見つからない

確認事項:
- `logs/` フォルダが存在するか
- ログファイルが `.jsonl` 形式か

### ❌ Excelが開かない / 文字化けしている

- `openpyxl` がインストールされているか確認
- macOSのNumbersではなく、Excelで開く

---

## 📝 ログの構造

ログファイルは JSONL形式（1行1JSON）で以下のフィールドを含みます：

```json
{
  "timestamp": "2026-02-09T10:17:32.096Z",
  "user_id": "AAA23179",
  "step": "click_reflection_history_btn",
  "session_id": "1765231432683",
  "preview": "今回の議論では...",
  "question_text": "..."
}
```

主要なイベント(`step`)：
- `login_success` - ログイン成功
- `click_reflection_history_btn` - 反省履歴クリック
- `click_history_btn` - 一般履歴クリック
- `restore_history_session` - セッション復元
- `save_individual_answer` - 反省保存
- `page_loaded_with_user` - ページロード

---

## ✅ チェックリスト

初回実行時：
- [ ] Python 3.6+ がインストール済み
- [ ] `pandas`, `openpyxl` がインストール済み
- [ ] `logs/` フォルダに `.jsonl` ファイルが存在
- [ ] スクリプトが実行可能

分析を実行したら：
- [ ] `ログ分析_詳細.xlsx` を確認
- [ ] `ログ分析_サマリー.csv` を確認
- [ ] 各シートの数字が期待値と一致しているか確認

---

Made with 💙 for Research Analytics
