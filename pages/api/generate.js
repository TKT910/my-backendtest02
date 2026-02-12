import { SYSTEM_PROMPT, inferTemplateType } from './promptTemplate.js';

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

    // --- キャッシュ関連の処理（fsを使う部分）をすべて削除しました ---

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
          { role: 'user', content: `分析対象のテキスト:\n${prompt}` },
        ],
        max_tokens: 1200,
        temperature: 0,
        top_p: 0.95,
      }),
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    
    if (!raw) {
      const finishReason = data?.choices?.[0]?.finish_reason || 'unknown';
      console.error('DEBUG: Content is EMPTY. Finish reason:', finishReason);
      return res.status(500).json({ error: `AIが応答を生成できませんでした。` });
    }

    let jsonString = raw.trim();
    if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7).trim();
    else if (jsonString.startsWith('```')) jsonString = jsonString.slice(3).trim();
    if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3).trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      const start = jsonString.indexOf('[');
      const end = jsonString.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = jsonString.substring(start, end + 1);
        parsed = JSON.parse(candidate);
      } else {
        throw e;
      }
    }

    const aiQuestionsArray = Array.isArray(parsed) ? parsed : [parsed];
    const enrichedQuestions = aiQuestionsArray.map(q => ({
      ...q,
      templateType: q.templateId || inferTemplateType(q.text || '')
    }));

    // キャッシュ保存（fs.writeFileSync）を削除したため、ここですぐに結果を返します
    return res.status(200).json(enrichedQuestions);

  } catch (err) {
    console.error('Internal Server Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}