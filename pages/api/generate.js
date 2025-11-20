// /pages/api/generate.js
export default async function handler(req, res) {
  // POSTメソッドのみを許可
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body; // prompt はフロントエンドから送られた元のテキスト全体

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // 既存のフロントエンドが期待するJSON形式を生成するためのシステムプロンプト
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
        // JSON構造化出力を確実にするため gpt-4-turbo を使用
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

    // APIからの応答をJSONとして取得
    const data = await response.json();
    
    // API自体がエラーを返した場合（例：キー切れ、トークン超過）
    if (!response.ok) {
        console.error("OpenAI API Error:", data);
        return res.status(response.status).json({ 
            error: data.error?.message || "OpenAI APIとの通信に失敗しました。" 
        });
    }

    let jsonString = data.choices?.[0]?.message?.content || "[]";
    
    // ★★★ ロバスト性を高めるための前処理：Markdownバッククォートを削除 ★★★
    jsonString = jsonString.trim();
    
    // '```json' または '```' で始まる場合、それを削除
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7).trim();
    } else if (jsonString.startsWith('```')) {
       jsonString = jsonString.substring(3).trim();
    }
    
    // 最後の '```' を削除
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3).trim();
    }
    
    let aiQuestionsArray;
    try {
        const parsed = JSON.parse(jsonString);
        
        // 応答が配列（期待される形式）か、配列をキーに持つオブジェクトかを確認
        aiQuestionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.list || parsed.items);
        
    } catch (e) {
        // JSONパースに失敗した場合
        console.error("Failed to parse JSON response from OpenAI:", jsonString);
        return res.status(500).json({ error: "AIからの応答形式が不正です。" });
    }
    
    // 最終的に有効な配列が取得できたか確認
    if (!aiQuestionsArray || !Array.isArray(aiQuestionsArray)) {
        console.error("AI did not return a valid array:", aiQuestionsArray);
        return res.status(500).json({ error: "AIが期待される形式の質問リストを生成できませんでした。" });
    }

    // 成功時: 質問リストの配列をそのままフロントエンドに返す
    res.status(200).json(aiQuestionsArray);
  } catch (err) {
    // 予期せぬエラー（ネットワークエラーなど）
    console.error("Internal Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}