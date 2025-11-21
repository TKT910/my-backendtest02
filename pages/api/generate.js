// /pages/api/generate.js
export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
      console.error("API Key is missing in Vercel environment.");
      return res.status(500).json({ error: "APIキーが設定されていません。" });
  }
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
    // /pages/api/generate.js の systemPrompt (修正後)

const systemPrompt = `あなたは優秀な編集者であり、与えられたテキストを深く理解するための内省的な質問を生成する専門家です。
以下の手順に従って、入力されたテキストに対して質問を生成し、**必ずJSON配列形式**で出力してください。

1. 入力テキストを段落ごとに分け、**最低でも1つ**、曖昧な表現や補足を促す質問を作成してください。
2. 出力は、**このリストを直接示すJSON配列のみ**とし、説明文、挨拶、Markdownのバッククォート**以外の文字は一切含めないでください**。
3. **質問が1つしかない場合でも、必ず配列の形式（[ ]）でラップしてください。**

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
        // JSON構造化出力を確実にするため gpt-4o を使用
        model: "gpt-4o", 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `ターゲットテキスト:\n${prompt}` }
        ],
        // JSON形式を要求
        response_format: { type: "json" }, 
        max_tokens: 4096,
      }),
    });

    // APIからの応答をJSONとして取得
    const data = await response.json();
    
    // ... (API自体がエラーを返した場合の処理は省略)

    let jsonString = data.choices?.[0]?.message?.content;
    
    // --- ★ デバッグログの追加ポイント ★ ---
    if (!jsonString) {
        // 1. contentが空だった場合のデバッグログ
        const finishReason = data.choices?.[0]?.finish_reason || 'unknown';
        console.error("DEBUG: Content is EMPTY. Finish reason:", finishReason);
        
        // ★ ログ追加のため、エラーメッセージも少し修正（Finish Reasonを出力）
        if (finishReason === 'content_filter') {
            return res.status(400).json({ error: "入力内容がOpenAIの安全ポリシーに抵触しました。" });
        }
        // max_tokensを4096から2048に戻す（テストを兼ねて）
        if (finishReason === 'length') {
            return res.status(500).json({ error: "AIの応答が長すぎるため途中で打ち切られました（max_tokens: 4096）。" });
        }
        return res.status(500).json({ error: "AIが応答を生成できませんでした（Finish Reason: " + finishReason + "）。" });
    }

    // 2. AIが返した生の文字列をターミナルに出力
    console.log("DEBUG: Raw JSON String from AI:\n", jsonString);
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

    let tempArray = null;

    // 1. 返り値がそのまま配列
    if (Array.isArray(parsed)) {
        tempArray = parsed;
    }
    // 2. 配列を含んでいる形式（questions / list / items）
    else if (
        Array.isArray(parsed.questions) ||
        Array.isArray(parsed.list) ||
        Array.isArray(parsed.items)
    ) {
        tempArray =
            parsed.questions ||
            parsed.list ||
            parsed.items;
    }
    // 3. それ以外 → 単一のオブジェクト
    else {
        tempArray = [parsed]; // ← ここが一番重要！！
    }

    aiQuestionsArray = tempArray;

} catch (e) {
     console.error("JSON parse error:", e);
    return res.status(500).json({ error: "Invalid JSON returned from AI." });
}

    
    // 最終的に有効な配列が取得できたか確認 (このチェックは空配列でも通るようにしておく)
    if (!Array.isArray(aiQuestionsArray)) {
        console.error("AI did not return a valid array (Final check failed):", aiQuestionsArray);
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