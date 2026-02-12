import Head from 'next/head';
import Script from 'next/script';

// Mammoth.js (Word読み込み用)
const MAMMOTH_SRC = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js";
// Word保存用
const DOCX_JS_SRC = "https://cdn.jsdelivr.net/npm/docx@7.1.0/build/index.min.js";
const FILESAVER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
// 差分計算用
const JSDIFF_SRC = "https://cdn.jsdelivr.net/npm/diff@5.1.0/dist/diff.min.js";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 font-sans">
      <Head>
        <title>テキストAI編集 Studio</title>
      </Head>

      {/* ライブラリ読み込み */}
      <Script src={MAMMOTH_SRC} strategy="beforeInteractive" />
      <Script src={DOCX_JS_SRC} strategy="beforeInteractive" />
      <Script src={FILESAVER_SRC} strategy="beforeInteractive" />
      <Script src={JSDIFF_SRC} strategy="beforeInteractive" />
      
      {/* メインスクリプト */}
      <Script src="/script.js" strategy="lazyOnload" />

      {/* ★ログイン画面（全画面オーバーレイ） */}
      <div id="loginOverlay" className="fixed inset-0 bg-gray-100 z-[100] flex flex-col items-center justify-center p-4 transition-opacity duration-500">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                  🎓
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">ようこそ</h2>
              <p className="text-gray-500 mb-8">実験を開始するために、学籍番号を入力してください。</p>
              
              <div className="text-left mb-6">
                  <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">学籍番号 (半角英数字)</label>
                  <input 
                      type="text" 
                      id="loginIdInput" 
                      className="w-full p-4 border border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono transition-all placeholder-gray-300" 
                      placeholder="b2212345" 
                  />
              </div>
              
              <button id="loginStartBtn" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 mb-6">
                  実験を始める
              </button>

              {/* ★追加: マニュアル表示ボタン */}
              <button id="loginHelpBtn" className="text-sm text-gray-500 hover:text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto transition-colors">
                  <span>📖</span> 使い方ガイドを見る
              </button>
          </div>
      </div>

      {/* ヘッダーバー */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 h-16 flex items-center px-6 justify-between flex-none sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full inline-block"></span>
            AI Reflection Studio
            </h1>
            <button id="newSessionBtn" className="hidden text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-bold flex items-center gap-1">
                <span>➕</span> 新規
            </button>
        </div>

        <div id="controls" className='flex gap-2'>
            <button id="historyBtn" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50">
                <span>🕒</span> 履歴
            </button>
            <button id="reflectionHistoryBtn" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 mr-2">
                <span>💭</span> 内省履歴
            </button>

            <button id="saveWordBtn" className="hidden text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 border border-gray-300 rounded px-2 py-1">
                <span>💾</span> Word保存
            </button>
            <button id="helpBtn" className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-100" title="使い方を見る">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            <button id="showSummaryBtn" className="hidden text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                全回答サマリー
            </button>
        </div>
      </header>
      
      {/* メインコンテナ */}
      <div id="container" className="flex-grow flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-64px)] overflow-hidden">
        
        {/* --- 左カラム: 元文 --- */}
        <div id="left" className="flex-1 flex flex-col min-w-0">
          <div id="leftHeader" className="flex justify-between items-end mb-3 px-1 flex-none">
            <h2 className="font-bold text-gray-600 text-sm uppercase tracking-wider">Source Text</h2>
            <div className="flex gap-2">
                <button id="showOriginalSourceBtn" className="hidden text-xs text-blue-600 hover:underline bg-transparent border-none p-0">最初の原文を表示</button> 
                <button id="backToSelectBtn" className="hidden text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 shadow-sm">戻る</button>
            </div>
          </div>

          <div className="flex-grow flex flex-col relative">
            <div id="inputMethodSelection" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-8 text-center z-10">
                <div className="mb-8">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">振り返りを始める</h3>
                    <p className="text-gray-500 text-sm mb-6">テキストを入力するか、ファイルをアップロード</p>
                </div>
                <div className="space-y-3 w-full max-w-xs">
                    <button id="selectTextInputBtn" className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2">
                        <span>📝</span> テキスト入力
                    </button>
                    <label htmlFor="selectFileInput" className="file-upload-label w-full py-3 px-4 bg-blue-600 border border-transparent text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 cursor-pointer transition-all flex items-center justify-center gap-2">
                        <span>📂</span> ファイル読込
                    </label>
                    <input type="file" id="selectFileInput" accept=".txt,.doc,.docx" className="hidden" />
                </div>
                <p className="mt-4 text-xs text-gray-400">.txt / .docx</p>
            </div>
            
            <textarea 
                id="originalContainer" 
                className="hidden flex-grow w-full p-5 resize-none focus:outline-none text-base leading-relaxed text-gray-700 scrollBox bg-white rounded-xl shadow-sm border border-gray-200" 
                placeholder="ここに文章を入力..."
            ></textarea>

            <div 
                id="readonlyContainer" 
                className="hidden flex-grow w-full p-5 overflow-y-auto text-base leading-relaxed text-gray-700 scrollBox bg-white rounded-xl shadow-sm border border-gray-200 whitespace-pre-wrap min-h-0"
            ></div>

            <div id="textInputButtons" className="hidden mt-3 flex gap-3 flex-none">
                <button id="submitTextBtn" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all">確定する</button>
                <button id="cancelTextInputBtn" className="w-24 bg-white text-gray-600 border border-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-50">クリア</button>
            </div>
          </div>
        </div>

        {/* --- 中央カラム: 質問リスト --- */}
        <div id="center" className="flex-1 flex flex-col min-w-0">
          <div id="centerHeader" className="flex justify-between items-end mb-3 px-1 flex-none"> 
            <h2 className="font-bold text-gray-600 text-sm uppercase tracking-wider">Questions</h2>
            <button id="sendToAI" className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-1">
                <span>✨</span> 質問生成
            </button>
          </div>
          <div id="questionList" className="flex-grow overflow-y-auto pr-2 -mr-2 scrollBox">
              <div className="text-center text-gray-400 mt-20 text-sm">質問がここに表示されます</div>
          </div>
          <div id="floatingAnswer" className="hidden"></div>
        </div>

        {/* --- 右カラム: 書き換え --- */}
        <div id="right" className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-end mb-3 px-1 flex-none">
             <h2 className="font-bold text-gray-600 text-sm uppercase tracking-wider">Rewrite / Final</h2>
          </div>
          <div className="flex-grow flex flex-col relative">
            <textarea 
                id="editedText" 
                placeholder="ここで推敲・書き換えを行います..." 
                className="flex-grow w-full p-5 resize-none focus:outline-none text-base leading-relaxed text-gray-700 scrollBox bg-white rounded-xl shadow-sm border border-gray-200"
            ></textarea>
          </div>
          <div className="mt-3 flex-none">
            <button id="reflectToOriginalBtn" className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl shadow hover:shadow-lg hover:bg-gray-900 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                元文に反映する
            </button>
          </div>
        </div>
      </div>
      
      {/* 履歴モーダル */}
      <div id="historyModalOverlay" className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden animate-scale-in">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>🕒</span> 過去の履歴</h2>
            <button id="closeHistoryBtn" className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">✕</button>
          </div>
          <div id="historyListContent" className="flex-grow p-4 overflow-y-auto scrollBox bg-gray-50 space-y-3">
             {/* JSでここにリストを表示 */}
          </div>

          {/* フッター（全削除ボタン） */}
          <div className="p-4 border-t border-gray-200 bg-white flex justify-center">
            <button id="clearAllHistoryBtn" className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-bold flex items-center gap-1">
                <span>🗑️</span> 履歴をすべて削除
            </button>
          </div>
        </div>
      </div>

      {/* ファイル名指定保存モーダル */}
      <div id="saveModalOverlay" className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-md font-bold text-gray-800 flex items-center gap-2">
                    <span>💾</span> Wordで保存
                </h2>
                <button id="cancelSaveBtnTop" className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">✕</button>
            </div>
            
            <div className="p-6">
                <label className="block text-xs font-bold text-gray-500 mb-2">ファイル名</label>
                <div className="relative">
                    <input 
                        type="text" 
                        id="saveFileNameInput" 
                        className="w-full p-3 pl-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="reflection_log" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">.docx</span>
                </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
                <button id="cancelSaveBtn" className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">キャンセル</button>
                <button id="confirmSaveBtn" className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all flex items-center gap-1">
                    保存する
                </button>
            </div>
        </div>
      </div>

      {/* サマリーモーダル */}
      <div id="summaryModalOverlay" className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div id="summaryModalContent" className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-scale-in">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">振り返りサマリー</h2>
            <button id="closeSummaryBtn" className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">✕</button>
          </div>
          <div id="summaryContent" className="flex-grow p-8 overflow-y-auto scrollBox"></div>
        </div>
      </div>

      {/* ★修正: 使い方ガイド（z-indexを上げてログイン画面より前に出す） */}
      <div id="helpModalOverlay" className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>📖</span> 使い方ガイド</h2>
                <button id="closeHelpBtn" className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">✕</button>
            </div>
            <div className="p-8 space-y-6">
               <div className="flex gap-4"><div className="flex-none w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold">1</div><div><h3 className="font-bold text-gray-800 mb-1">原文を入力</h3><p className="text-sm text-gray-600">左側のエリアに入力またはロードし「確定」します。</p></div></div>
               <div className="flex gap-4"><div className="flex-none w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">2</div><div><h3 className="font-bold text-gray-800 mb-1">質問生成</h3><p className="text-sm text-gray-600">「✨質問生成」でAIが深掘りポイントを提示します。</p></div></div>
               <div className="flex gap-4"><div className="flex-none w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</div><div><h3 className="font-bold text-gray-800 mb-1">対話・振り返り</h3><p className="text-sm text-gray-600">質問をダブルクリックして、回答と「なぜそう書いたか」を言語化します。</p></div></div>
               <div className="flex gap-4"><div className="flex-none w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">4</div><div><h3 className="font-bold text-gray-800 mb-1">推敲・反映</h3><p className="text-sm text-gray-600">右側で書き直し「反映」すると、変更点が波線と赤色で表示されます。</p></div></div>
            </div>
            <div className="p-4 bg-gray-50 text-center">
                <button id="closeHelpBtnBottom" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">わかった！</button>
            </div>
        </div>
      </div>

      {/* 汎用確認ダイアログモーダル */}
      <div id="confirmModalOverlay" className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 id="confirmModalTitle" className="text-md font-bold text-gray-800 flex items-center gap-2">
                    <span>⚠️</span> 確認
                </h2>
            </div>
            
            <div className="p-6">
                <p id="confirmModalMessage" className="text-sm text-gray-700 font-medium leading-relaxed">
                    {/* JSでメッセージを表示 */}
                </p>
            </div>

            <div className="p-4 bg-gray-50 flex gap-2 border-t border-gray-100">
                <button id="confirmModalCancelBtn" className="flex-1 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    キャンセル
                </button>
                <button id="confirmModalOkBtn" className="flex-1 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all">
                    続ける
                </button>
            </div>
        </div>
      </div>

      {/* 内省履歴モーダル */}
      <div id="reflectionHistoryModalOverlay" className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-scale-in">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>💭</span> 過去の内省履歴
            </h2>
            <button id="closeReflectionHistoryBtn" className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">✕</button>
          </div>
          <div id="reflectionHistoryContent" className="flex-grow p-6 overflow-y-auto scrollBox bg-gray-50">
            {/* JSでここに内省履歴を表示 */}
            <div className="text-center text-gray-400 py-20 text-sm">読み込み中...</div>
          </div>
        </div>
      </div>

      {/* 履歴アクション選択モーダル */}
      <div id="historyActionModalOverlay" className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-md font-bold text-gray-800 flex items-center gap-2">
                    <span>🕒</span> 履歴を操作
                </h2>
                <button id="cancelHistoryActionBtn" className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">✕</button>
            </div>
            
            <div className="p-6">
                <div id="historyActionPreview" className="text-sm text-gray-800 font-medium line-clamp-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {/* JSで履歴プレビューを表示 */}
                </div>
                <p className="text-xs text-gray-500 mb-4">この履歴に対して、以下の操作を選択してください。</p>
            </div>

            <div className="p-4 bg-gray-50 flex gap-2 border-t border-gray-100">
                <button id="cancelHistoryActionBtnBottom" className="flex-1 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">キャンセル</button>
                <button id="restoreHistoryActionBtn" className="flex-1 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all">
                    復元する
                </button>
                <button id="deleteHistoryActionBtn" className="flex-1 px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-md transition-all">
                    削除する
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}