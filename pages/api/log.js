import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // POSTメソッド以外は拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userName, step, data } = req.body;
  
  // プロジェクト直下の 'logs' フォルダに保存
  const logsDir = path.join(process.cwd(), 'logs');
  
  // フォルダがなければ作成
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  // ファイル名決定: YYYYMMDD_学籍番号.jsonl
  // ※念のため英数字以外は除去して安全にする
  const safeId = (userName || 'guest').replace(/[^a-zA-Z0-9]/g, ''); 
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filePath = path.join(logsDir, `${dateStr}_${safeId}.jsonl`);

  // 保存データを作成
  const logEntry = {
    timestamp: new Date().toISOString(),
    user_id: safeId,
    step: step,
    ...data
  };

  try {
    // ファイルに追記（JSON Lines形式）
    fs.appendFileSync(filePath, JSON.stringify(logEntry, null, 0) + '\n');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Log write error:', error);
    return res.status(500).json({ error: 'Failed to write log' });
  }
}