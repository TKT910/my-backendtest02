import { SYSTEM_PROMPT, inferTemplateType } from './promptTemplate.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// キャッシュディレクトリ
const CACHE_DIR = path.join(process.cwd(), 'data', 'ai_cache');

// キャッシュディレクトリを確保
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// テキストのハッシュを計算
function getPromptHash(prompt) {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

// キャッシュから読み込み
function getCachedQuestions(prompt) {
  const hash = getPromptHash(prompt);
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = fs.readFileSync(cacheFile, 'utf8');
      return JSON.parse(cached);
    } catch (e) {
      console.error('Cache read error:', e);
      return null;
    }
  }
  return null;
}

// キャッシュに書き込み
function cacheQuestions(prompt, questions) {
  const hash = getPromptHash(prompt);
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(questions, null, 2));
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('API Key is missing in environment.');
      return res.status(500).json({ error: 'APIキーが設定されていません。' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // キャッシュを確認
    const cachedQuestions = getCachedQuestions(prompt);
    if (cachedQuestions) {
      console.log('🔄 キャッシュから返却:', getPromptHash(prompt));
      return res.status(200).json(cachedQuestions);
    }

    const systemPrompt = SYSTEM_PROMPT;


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `分析対象のテキスト:
${prompt}` },
        ],
        max_tokens: 1200,
        temperature: 0,
        top_p: 0.95,
      }),
    });

    const data = await response.json();
    console.log('DEBUG: Full API response:', JSON.stringify(data, null, 2));

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      const finishReason = data?.choices?.[0]?.finish_reason || 'unknown';
      console.error('DEBUG: Content is EMPTY. Finish reason:', finishReason);
      return res.status(500).json({ error: `AIが応答を生成できませんでした（Finish Reason: ${finishReason}）。` });
    }

    let jsonString = raw.trim();
    if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7).trim();
    else if (jsonString.startsWith('```')) jsonString = jsonString.slice(3).trim();
    if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3).trim();

    // Try to find first JSON array/object in the text
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      // fallback: try to extract JSON substring
      const start = jsonString.indexOf('[');
      const end = jsonString.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = jsonString.substring(start, end + 1);
        try {
          parsed = JSON.parse(candidate);
        } catch (e2) {
          console.error('JSON parse error (fallback):', e2);
          return res.status(500).json({ error: 'Invalid JSON returned from AI.' });
        }
      } else {
        console.error('JSON parse error:', e);
        return res.status(500).json({ error: 'Invalid JSON returned from AI.' });
      }
    }

    const aiQuestionsArray = Array.isArray(parsed) ? parsed : [parsed];
    if (!Array.isArray(aiQuestionsArray)) {
      return res.status(500).json({ error: 'AIが期待される形式の質問リストを生成できませんでした。' });
    }

    // 各質問にtemplate_typeを推論して追加（AIが返してなければ）
    const enrichedQuestions = aiQuestionsArray.map(q => ({
      ...q,
      templateType: q.templateId || inferTemplateType(q.text || '')
    }));

    // キャッシュに保存
    cacheQuestions(prompt, enrichedQuestions);
    console.log('💾 キャッシュに保存しました:', getPromptHash(prompt));

    return res.status(200).json(enrichedQuestions);
  } catch (err) {
    console.error('Internal Server Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
