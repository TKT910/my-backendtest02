// /pages/api/generate.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body; // prompt は元のテキスト全体

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // ★ 既存のフロントエンドが期待するJSON形式を生成するためのプロンプト
    const systemPrompt = `あなたは優秀な編集者であり、与えられたテキストを深く理解するための内省的な質問を生成する専門家です。
以下の手順に従って、入力されたテキストに対して質問を生成し、JSON配列形式で出力してください。

1. 入力テキストを段落ごとに分け、各段落について、曖昧な表現や補足を促す質問を1つ作成してください。
2. 出力は、質問のリストを含む**JSON配列のみ**とし、他の説明文は一切含めないでください。

出力JSON形式:
[
  {
    "text": "生成された質問文。",
    "targetText": "質問が関連する元のテキストの段落全体。"
  }
  // ... 必要な数だけ続く
]
`;

    // OpenAI API呼び出し
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // 構造化出力を確実にするため gpt-4-turbo を推奨
        model: "gpt-4-turbo", 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `ターゲットテキスト:\n${prompt}` }
        ],
        // JSON形式を要求
        response_format: { type: "json_object" }, 
        max_tokens: 4096,
      }),
    });

    const data = await response.json();
    let jsonString = data.choices?.[0]?.message?.content || "[]";
    
    let aiQuestionsArray;
    try {
        // JSON文字列をパースし、配列部分を取得
        const parsed = JSON.parse(jsonString);
        // JSONオブジェクトの場合、配列が 'questions' や 'list' などのキーに格納されている可能性があるため対応
        aiQuestionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.list || parsed.items);
    } catch (e) {
        console.error("AIからの応答形式が不正です:", jsonString);
        return res.status(500).json({ error: "AIからの応答形式が不正です。" });
    }
    
    if (!aiQuestionsArray || !Array.isArray(aiQuestionsArray)) {
        return res.status(500).json({ error: "AIが期待される形式の質問リストを生成できませんでした。" });
    }

    // 成功時: 質問リストの配列をそのまま返す
    res.status(200).json(aiQuestionsArray);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}