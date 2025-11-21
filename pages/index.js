// /pages/index.js (修正後)

import Head from 'next/head';
import { useState, useCallback } from 'react';
// UIコンポーネントは既存のものを使用

const HomePage = () => {
  // ユーザーの入力プロンプトを保持
  const [prompt, setPrompt] = useState('');
  // APIの結果テキストを保持
  const [resultText, setResultText] = useState('');
  // ローディング状態
  const [isLoading, setIsLoading] = useState(false);
  // エラーメッセージ
  const [error, setError] = useState(null);

  // APIを呼び出す関数
  const generateContent = useCallback(async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResultText('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        // API Route側でエラー (400, 500など) が発生した場合
        throw new Error(data.error || 'API call failed');
      }

      // 🚨 修正ポイント: dataがJSON配列（質問リスト）であることを想定して処理する
      if (Array.isArray(data)) {
        if (data.length === 0) {
            setResultText('AIは質問を生成しましたが、リストは空でした。');
        } else {
            // 質問リストを整形して表示用テキストにする
            const formattedQuestions = data.map((item, index) => 
                `--- 質問 ${index + 1} ---\n質問: ${item.text}\n関連段落:\n${item.targetText}`
            ).join('\n\n');
            
            setResultText(formattedQuestions);
        }
      } else {
          // 期待しないデータ形式の場合
          throw new Error('APIから返されたデータ形式が不正です。');
      }
      
    } catch (err) {
      console.error('Generation Error:', err);
      setError(err.message || 'コンテンツの生成中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);


  return (
    <>
      <Head>
        <title>AI Content Generator</title>
      </Head>

      {/* Headerコンポーネント（既存） */}
      <header>
        <h1>AIコンテンツジェネレーター</h1>
      </header>
      
      {/* Mainコンポーネント (三分割UIの中心) */}
      <main style={{ padding: '20px' }}>
        <h2>コンテンツ生成</h2>

        {/* 1. 入力フォーム */}
        <form onSubmit={generateContent} style={{ marginBottom: '20px' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ここに生成したいコンテンツのプロンプトを入力してください..."
            rows="5"
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', marginTop: '10px' }}>
            {isLoading ? '生成中...' : 'コンテンツを生成'}
          </button>
        </form>

        {/* 2. ローディング表示 */}
        {isLoading && (
          <p style={{ color: 'blue' }}>データを取得中です。少々お待ちください...</p>
        )}

        {/* 3. エラー表示 */}
        {error && (
          <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
            **エラー:** {error}
          </p>
        )}

        {/* 4. 結果表示 */}
        {resultText && (
          <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '15px' }}>
            <h3>生成結果:</h3>
            {/* 改行を維持するために <pre> タグや pre-wrap を使用しているため、ここではスタイルを維持 */}
            <p style={{ whiteSpace: 'pre-wrap' }}>{resultText}</p>
          </div>
        )}
      </main>

      {/* Footerコンポーネント（既存） */}
      <footer>
        <p>© 2024 AI App</p>
      </footer>
    </>
  );
};

export default HomePage;