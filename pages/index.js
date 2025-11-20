// /pages/index.js (抜粋・実装追加部分)

import Head from 'next/head';
import { useState, useCallback } from 'react';
// UIコンポーネントは既存のものを使用
// import { Header, Main, Footer } from '../components/Layout'; // 例

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
    if (!prompt.trim()) return; // プロンプトが空の場合は実行しない

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

      // 成功した場合
      setResultText(data.text);
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