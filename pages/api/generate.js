import { SYSTEM_PROMPT, inferTemplateType } from './promptTemplate.js';

export default async function handler(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const { prompt } = req.body || req.query;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `分析対象のテキスト:\n${prompt}` },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    
    if (!raw) return res.status(500).json({ error: 'AI応答が空でした' });

    // JSONのパース処理
    let jsonString = raw.trim();
    if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7).trim();
    if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3).trim();

    let parsed = JSON.parse(jsonString);
    const aiQuestionsArray = Array.isArray(parsed) ? parsed : [parsed];

    const enrichedQuestions = aiQuestionsArray.map(q => ({
      ...q,
      templateType: q.templateId || inferTemplateType(q.text || '')
    }));

    return res.status(200).json(enrichedQuestions);

  } catch (err) {
    console.error('Generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}