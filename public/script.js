/* Next.js互換版 script.js - 研究ログ機能：全アクション完全記録版 */

function initApp() {
    // --- 要素の取得 ---
    const loginOverlay = document.getElementById('loginOverlay');
    const loginIdInput = document.getElementById('loginIdInput');
    const loginStartBtn = document.getElementById('loginStartBtn');
    const loginHelpBtn = document.getElementById('loginHelpBtn');
    
    const originalContainer = document.getElementById('originalContainer');
    const readonlyContainer = document.getElementById('readonlyContainer');
    const floatingAnswer = document.getElementById('floatingAnswer');
    if (floatingAnswer) floatingAnswer.style.display = 'none';

    // UI要素
    const sendToAI = document.getElementById('sendToAI');
    const inputMethodSelection = document.getElementById('inputMethodSelection');
    const selectTextInputBtn = document.getElementById('selectTextInputBtn');
    const selectFileInput = document.getElementById('selectFileInput');
    const backToSelectBtn = document.getElementById('backToSelectBtn');
    const showOriginalSourceBtn = document.getElementById('showOriginalSourceBtn'); 
    const saveWordBtn = document.getElementById('saveWordBtn');
    const textInputButtons = document.getElementById('textInputButtons');
    const submitTextBtn = document.getElementById('submitTextBtn');
    const cancelTextInputBtn = document.getElementById('cancelTextInputBtn'); 
    const questionList = document.getElementById('questionList');
    const editedText = document.getElementById('editedText');
    const reflectToOriginalBtn = document.getElementById('reflectToOriginalBtn');
    const showSummaryBtn = document.getElementById('showSummaryBtn');
    const summaryModalOverlay = document.getElementById('summaryModalOverlay');
    const closeSummaryBtn = document.getElementById('closeSummaryBtn');
    const summaryContent = document.getElementById('summaryContent');
    const helpBtn = document.getElementById('helpBtn');
    const helpModalOverlay = document.getElementById('helpModalOverlay');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const closeHelpBtnBottom = document.getElementById('closeHelpBtnBottom');
    
    // 履歴関連
    const historyBtn = document.getElementById('historyBtn');
    const newSessionBtn = document.getElementById('newSessionBtn');
    const historyModalOverlay = document.getElementById('historyModalOverlay');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historyListContent = document.getElementById('historyListContent');
    const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');

    // 内省履歴関連
    const reflectionHistoryBtn = document.getElementById('reflectionHistoryBtn');
    const reflectionHistoryModalOverlay = document.getElementById('reflectionHistoryModalOverlay');
    const closeReflectionHistoryBtn = document.getElementById('closeReflectionHistoryBtn');
    const reflectionHistoryContent = document.getElementById('reflectionHistoryContent');

    // 履歴アクション選択モーダル関連
    const historyActionModalOverlay = document.getElementById('historyActionModalOverlay');
    const historyActionPreview = document.getElementById('historyActionPreview');
    const cancelHistoryActionBtn = document.getElementById('cancelHistoryActionBtn');
    const cancelHistoryActionBtnBottom = document.getElementById('cancelHistoryActionBtnBottom');
    const restoreHistoryActionBtn = document.getElementById('restoreHistoryActionBtn');
    const deleteHistoryActionBtn = document.getElementById('deleteHistoryActionBtn');

    // Word保存モーダル関連
    const saveModalOverlay = document.getElementById('saveModalOverlay');
    const saveFileNameInput = document.getElementById('saveFileNameInput');
    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    const cancelSaveBtn = document.getElementById('cancelSaveBtn');
    const cancelSaveBtnTop = document.getElementById('cancelSaveBtnTop');

    // 汎用確認ダイアログ関連
    const confirmModalOverlay = document.getElementById('confirmModalOverlay');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
    const confirmModalOkBtn = document.getElementById('confirmModalOkBtn');

    let questions = []; 
    let answers = {};   
    let paragraphs = []; 
    let originalSourceText = ''; 
    let isShowingOriginal = false; 
    let isInputMode = false;
    let editingQuestionId = null;
    let currentSessionId = Date.now().toString();
    let currentConfirmCallback = null; 
    let currentQuestionIndex = 0; 
    
    // --- 研究用ユーザーID(学籍番号)管理 ---
    let currentUserName = '';

    // ログイン処理関数
    const performLogin = () => {
        const val = loginIdInput ? loginIdInput.value.trim() : '';
        
        // バリデーション
        if (!val) {
            alert("⚠️ 学籍番号を入力してください。");
            if(loginIdInput) loginIdInput.focus();
            return;
        }
        if (!/^[a-zA-Z0-9]+$/.test(val)) {
            alert("⚠️ 学籍番号は「半角英数字」のみ使用できます。");
            if(loginIdInput) loginIdInput.focus();
            return;
        }

        // ログイン成功
        currentUserName = val;
        
        // URL更新
        const newUrl = `${window.location.pathname}?user=${currentUserName}`;
        window.history.replaceState(null, '', newUrl);

        // ログイン画面を消す
        if(loginOverlay) {
            loginOverlay.style.opacity = '0';
            setTimeout(() => {
                loginOverlay.style.display = 'none';
            }, 500);
        }
        
        // ★追加: ログイン成功ログ
        sendResearchLog('✅_user_login_completed', { login_id: currentUserName });
        window.toast.success(`ようこそ、${currentUserName} さん`);
    };

    // 初期化時：URLに既にIDがあればログイン画面をスキップ
    const urlParams = new URLSearchParams(window.location.search);
    const urlUser = urlParams.get('user');
    if (urlUser && /^[a-zA-Z0-9]+$/.test(urlUser)) {
        currentUserName = urlUser;
        if(loginOverlay) loginOverlay.style.display = 'none'; 
        if(loginIdInput) loginIdInput.value = urlUser;
        // URLアクセス時のログ（ページリロード含む）
        sendResearchLog('🌐_page_loaded', { user_from_url: urlUser });
    }

    // イベントリスナー設定
    if(loginStartBtn) {
        loginStartBtn.addEventListener('click', performLogin);
    }
    if(loginIdInput) {
        loginIdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') performLogin();
        });
    }
    
    // ログイン画面のヘルプボタン
    if(loginHelpBtn) {
        loginHelpBtn.addEventListener('click', () => {
            sendResearchLog('❓_help_opened_on_login', {});
            removeClass(helpModalOverlay, 'hidden');
        });
    }

    // ログ送信関数
    async function sendResearchLog(step, detailData) {
        const userId = currentUserName || new URLSearchParams(window.location.search).get('user') || 'guest';
        try {
            await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: userId,
                    step: step,
                    data: detailData
                })
            });
            console.log(`Log saved [${step}]`);
        } catch (e) {
            console.error("Log send error:", e);
        }
    }

    const addClass = (el, className) => { if(el) el.classList.add(className); };
    const removeClass = (el, className) => { if(el) el.classList.remove(className); };
    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };

    // 初期化
    if(originalContainer) addClass(originalContainer, 'hidden');
    if(readonlyContainer) addClass(readonlyContainer, 'hidden'); 
    if(backToSelectBtn) addClass(backToSelectBtn, 'hidden');
    if(showOriginalSourceBtn) addClass(showOriginalSourceBtn, 'hidden');
    if(saveWordBtn) addClass(saveWordBtn, 'hidden');
    if(showSummaryBtn) addClass(showSummaryBtn, 'hidden');
    if(textInputButtons) addClass(textInputButtons, 'hidden');
    if(inputMethodSelection) removeClass(inputMethodSelection, 'hidden'); 

    // --- 履歴保存・復元ロジック ---
    function saveCurrentSession() {
        const currentData = {
            id: currentSessionId,
            userName: currentUserName,
            timestamp: Date.now(),
            sourceText: originalSourceText,
            currentText: originalContainer.value,
            editedText: editedText ? editedText.value : '',
            questions: questions,
            answers: answers,
            preview: (originalContainer.value || "").replace(/\n/g, "").substring(0, 30)
        };

        if (!currentData.sourceText && !currentData.currentText) return;

        let history = JSON.parse(localStorage.getItem('reflection_history') || '[]');
        const existingIndex = history.findIndex(h => h.id === currentSessionId);
        
        if (existingIndex !== -1) {
            history[existingIndex] = currentData;
        } else {
            history.unshift(currentData);
        }
        
        if (history.length > 20) history = history.slice(0, 20);
        localStorage.setItem('reflection_history', JSON.stringify(history));
    }

    function loadSession(data) {
        showConfirmDialog(
            '📂 セッション復元',
            '現在の作業内容は上書きされます。\nよろしいですか？',
            () => {
                // ★追加: 履歴復元ログ
                sendResearchLog('🔄_session_restored', { session_id: data.id, preview: data.preview });

                currentSessionId = data.id;
                currentUserName = data.userName || ''; 
                originalSourceText = data.sourceText || "";
                originalContainer.value = data.currentText || "";
                
                if(editedText) {
                    editedText.value = data.editedText || "";
                    editedText.style.color = ''; 
                }

                questions = data.questions || [];
                answers = data.answers || {};
                currentQuestionIndex = 0; 
                
                addClass(inputMethodSelection, 'hidden');
                addClass(originalContainer, 'hidden');
                removeClass(readonlyContainer, 'hidden'); 
                readonlyContainer.textContent = originalContainer.value;
                
                if (originalSourceText) {
                    removeClass(showOriginalSourceBtn, 'hidden');
                    removeClass(newSessionBtn, 'hidden');
                }
                
                if (questions.length > 0) {
                    renderQuestionList();
                    removeClass(showSummaryBtn, 'hidden');
                    removeClass(saveWordBtn, 'hidden');
                } else {
                    questionList.innerHTML = '<div class="text-center text-gray-400 mt-20 text-sm">質問がここに表示されます</div>';
                }
                
                addClass(historyModalOverlay, 'hidden');
                window.toast.success("過去の振り返りを復元しました");
            }
        );
    }

    function renderHistoryList() {
        const history = JSON.parse(localStorage.getItem('reflection_history') || '[]');
        historyListContent.innerHTML = '';
        
        const myName = currentUserName || new URLSearchParams(window.location.search).get('user') || 'guest';
        const myHistory = history.filter(h => !h.userName || h.userName === myName);

        if (myHistory.length === 0) {
            historyListContent.innerHTML = '<div class="text-center text-gray-400 py-8 text-sm">このIDの履歴はありません。<br>振り返りを行うと自動で保存されます。</div>';
            return;
        }

        myHistory.forEach((item) => {
            const dateObj = new Date(item.timestamp);
            const dateStr = dateObj.toLocaleDateString('ja-JP');
            const timeStr = dateObj.toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'});
            const count = Object.keys(item.answers || {}).length;
            
            const el = document.createElement('div');
            el.className = 'bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group';
            
            el.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">📅 ${dateStr} ${timeStr}</span>
                    </div>
                    ${count > 0 ? `<span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">回答: ${count}件</span>` : ''}
                </div>
                <div class="text-sm text-gray-800 font-medium line-clamp-2 mb-3">
                    ${escapeHtml(item.preview) || "(未入力)"}...
                </div>
                <div class="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    クリックして操作を選択
                </div>
            `;
            const realIndex = history.findIndex(h => h.id === item.id);
            el.addEventListener('click', () => {
                showHistoryActionModal(item, realIndex, history);
            });
            historyListContent.appendChild(el);
        });
    }

    function showHistoryActionModal(item, index, history) {
        currentHistoryAction = { item, index, history };
        if(historyActionPreview) {
            historyActionPreview.textContent = `${escapeHtml(item.preview)}...`;
        }
        removeClass(historyActionModalOverlay, 'hidden');
    }

    // ★追加: 内省履歴UI初期化関数（シンプル版）
    let reflectionSearchKeyword = '';

    function initReflectionHistoryUI() {
        // ツールバー部分を作成（まだUIに追加されていなければ）
        let toolbar = document.getElementById('reflectionHistoryToolbar');
        if (!toolbar) {
            const header = reflectionHistoryModalOverlay.querySelector('[class*="bg-gradient"]');
            if (header) {
                toolbar = document.createElement('div');
                toolbar.id = 'reflectionHistoryToolbar';
                toolbar.className = 'px-6 py-4 border-b border-gray-200 bg-white flex gap-3 items-center';
                toolbar.innerHTML = `
                    <input type="text" id="reflectionSearchInput" placeholder="🔍 気づきでキーワード検索..." class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                `;
                header.parentNode.insertBefore(toolbar, header.nextSibling);

                // 検索ボックスのイベント
                const searchInput = toolbar.querySelector('#reflectionSearchInput');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        reflectionSearchKeyword = e.target.value.toLowerCase();
                        renderReflectionHistory(reflectionSearchKeyword);
                    });
                }
            }
        }
    }

    // ★追加: 内省履歴を表示する関数（シンプル版）
    function renderReflectionHistory(searchKeyword = '') {
        const history = JSON.parse(localStorage.getItem('reflection_history') || '[]');
        reflectionHistoryContent.innerHTML = '';
        
        const myName = currentUserName || new URLSearchParams(window.location.search).get('user') || 'guest';
        const myHistory = history.filter(h => {
            const isMyHistory = !h.userName || h.userName === myName;
            const hasReflections = h.answers && Object.keys(h.answers).length > 0;
            return isMyHistory && hasReflections;
        });

        if (myHistory.length === 0) {
            reflectionHistoryContent.innerHTML = `
                <div class="text-center text-gray-400 py-20">
                    <div class="text-6xl mb-4">💭</div>
                    <p class="text-sm">まだ内省データがありません。</p>
                    <p class="text-xs mt-2">質問に回答すると、ここに履歴が表示されます。</p>
                </div>
            `;
            return;
        }

        // 思考・気づきリストを構築
        const thoughts = [];
        myHistory.forEach((item) => {
            const questions = item.questions || [];
            const answers = item.answers || {};
            questions.forEach((q) => {
                const answer = answers[q.id];
                if (answer && answer.reflection) {
                    thoughts.push({
                        timestamp: item.timestamp,
                        sessionId: item.id,
                        question: q.text,
                        reflection: answer.reflection,
                        dateObj: new Date(item.timestamp),
                        sessionData: item
                    });
                }
            });
        });

        thoughts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        let filteredThoughts = thoughts;
        if (searchKeyword) {
            filteredThoughts = thoughts.filter(t => 
                t.question.toLowerCase().includes(searchKeyword) ||
                t.reflection.toLowerCase().includes(searchKeyword)
            );
        }

        if (filteredThoughts.length === 0) {
            reflectionHistoryContent.innerHTML = '<div class="text-center text-gray-400 py-8">検索結果がありません</div>';
            return;
        }

        filteredThoughts.forEach((thought) => {
            const dateStr = thought.dateObj.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = thought.dateObj.toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'});

            const card = document.createElement('div');
            card.className = 'mb-4 bg-white rounded-lg p-4 border-l-4 border-blue-400 shadow-sm hover:shadow-md hover:border-blue-600 transition-all cursor-pointer group';
            card.style.cursor = 'pointer';
            
            card.innerHTML = `
                <div class="text-xs text-gray-500 mb-2 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                    <span>📅</span> ${dateStr} ${timeStr}
                </div>
                <div class="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded border border-gray-200 group-hover:bg-blue-50 transition-colors">
                    <span class="font-bold text-gray-700">Q:</span> ${escapeHtml(thought.question)}
                </div>
                <div class="bg-gradient-to-r from-blue-50 to-transparent p-3 rounded">
                    <div class="text-xs font-bold text-blue-600 mb-1">💡 気づき</div>
                    <div class="text-sm text-gray-800 leading-relaxed line-clamp-3">${escapeHtml(thought.reflection)}</div>
                </div>
                <div class="text-xs text-gray-400 mt-3 group-hover:text-blue-500 transition-colors font-bold">
                    ▶ クリックしてこの時の会話に戻る
                </div>
            `;
            
            card.addEventListener('click', () => {
                // セッションを復元
                loadSession(thought.sessionData);
                addClass(reflectionHistoryModalOverlay, 'hidden');
            });
            
            reflectionHistoryContent.appendChild(card);
        });
    }

    let currentHistoryAction = null; 

    const closeHistoryActionModal = () => {
        addClass(historyActionModalOverlay, 'hidden');
        currentHistoryAction = null;
    };
    
    if(cancelHistoryActionBtn) cancelHistoryActionBtn.addEventListener('click', closeHistoryActionModal);
    if(cancelHistoryActionBtnBottom) cancelHistoryActionBtnBottom.addEventListener('click', closeHistoryActionModal);
    
    if(restoreHistoryActionBtn) restoreHistoryActionBtn.addEventListener('click', () => {
        if(currentHistoryAction) {
            loadSession(currentHistoryAction.item);
            closeHistoryActionModal();
            addClass(historyModalOverlay, 'hidden');
        }
    });
    
    if(deleteHistoryActionBtn) deleteHistoryActionBtn.addEventListener('click', () => {
        if(currentHistoryAction) {
            showConfirmDialog('🗑️ 履歴削除', 'この履歴を削除しますか？', () => {
                // ★追加: 履歴削除ログ
                sendResearchLog('❌_history_item_deleted', { session_id: currentHistoryAction.item.id });

                currentHistoryAction.history.splice(currentHistoryAction.index, 1);
                localStorage.setItem('reflection_history', JSON.stringify(currentHistoryAction.history));
                renderHistoryList();
                window.toast.success('履歴を削除しました');
            });
            closeHistoryActionModal();
        }
    });

    if(historyBtn) historyBtn.addEventListener('click', () => {
        sendResearchLog('📋_session_history_opened', {}); // ログ
        renderHistoryList();
        removeClass(historyModalOverlay, 'hidden');
    });
    if(closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => addClass(historyModalOverlay, 'hidden'));

    // ★追加: 内省履歴ボタンのイベントリスナー
    if(reflectionHistoryBtn) reflectionHistoryBtn.addEventListener('click', () => {
        sendResearchLog('💭_reflection_history_opened', {}); // ログ
        initReflectionHistoryUI();
        renderReflectionHistory('');
        removeClass(reflectionHistoryModalOverlay, 'hidden');
    });
    if(closeReflectionHistoryBtn) closeReflectionHistoryBtn.addEventListener('click', () => {
        addClass(reflectionHistoryModalOverlay, 'hidden');
    });

    if(clearAllHistoryBtn) clearAllHistoryBtn.addEventListener('click', () => {
        sendResearchLog('🗑️_clear_history_opened', {}); // ログ
        showConfirmDialog('🗑️ 全削除', '履歴をすべて削除しますか？\n（この操作は取り消せません）', () => {
            // ★追加: 全履歴削除ログ
            sendResearchLog('🗑️_all_history_cleared', {});
            
            localStorage.removeItem('reflection_history');
            renderHistoryList();
            window.toast.success('履歴をすべて削除しました');
        });
    });

    function showConfirmDialog(title, message, onConfirm) {
        if(confirmModalTitle) confirmModalTitle.textContent = title;
        if(confirmModalMessage) confirmModalMessage.textContent = message;
        currentConfirmCallback = onConfirm;
        removeClass(confirmModalOverlay, 'hidden');
    }

    const closeConfirmDialog = () => {
        addClass(confirmModalOverlay, 'hidden');
        currentConfirmCallback = null;
    };

    if(confirmModalCancelBtn) confirmModalCancelBtn.addEventListener('click', closeConfirmDialog);
    if(confirmModalOkBtn) confirmModalOkBtn.addEventListener('click', () => {
        if(currentConfirmCallback) {
            currentConfirmCallback();
        }
        closeConfirmDialog();
    });

    if(newSessionBtn) newSessionBtn.addEventListener('click', () => {
        sendResearchLog('✨_new_session_started', {}); // ログ
        showConfirmDialog(
            '➕ 新規作成',
            '現在の内容をクリアして新規作成しますか？\n（履歴には自動保存されます）',
            () => {
                saveCurrentSession(); 
                currentSessionId = Date.now().toString(); 
                resetToSelection();
                window.toast.success("新しいセッションを開始しました");
            }
        );
    });

    function resetToSelection() {
        removeClass(inputMethodSelection, 'hidden');
        addClass(originalContainer, 'hidden');
        addClass(readonlyContainer, 'hidden'); 
        addClass(backToSelectBtn, 'hidden');
        addClass(textInputButtons, 'hidden');
        isInputMode = false;
        if(originalContainer) originalContainer.value = ''; 
        if(readonlyContainer) readonlyContainer.textContent = ''; 
        if(questionList) questionList.innerHTML = '<div class="text-center text-gray-400 mt-20 text-sm">質問がここに表示されます</div>';
        if(editedText) {
            editedText.value = '';
            editedText.style.color = ''; 
        }
        questions = [];
        answers = {};
        editingQuestionId = null;
        paragraphs = [];
        originalSourceText = '';
        isShowingOriginal = false;
        addClass(showOriginalSourceBtn, 'hidden'); 
        if(showOriginalSourceBtn) showOriginalSourceBtn.textContent = '最初の原文を表示';
        addClass(saveWordBtn, 'hidden');
        addClass(showSummaryBtn, 'hidden');
        if(selectFileInput) selectFileInput.value = '';
        addClass(newSessionBtn, 'hidden');
    }

    function showOriginalArea(mode) {
        addClass(inputMethodSelection, 'hidden');
        removeClass(originalContainer, 'hidden'); 
        addClass(readonlyContainer, 'hidden');     
        removeClass(backToSelectBtn, 'hidden');
        if (mode === 'textInput' || mode === 'fileLoad') { 
            if(originalContainer) {
                originalContainer.removeAttribute('readonly'); 
                originalContainer.focus();
                if (mode === 'textInput') originalContainer.value = ''; 
            }
            removeClass(textInputButtons, 'hidden'); 
            isInputMode = true;
        }
    }

    function confirmText(text) {
        if(!text) text = "";
        originalContainer.setAttribute('readonly', 'true');
        addClass(originalContainer, 'hidden'); 
        removeClass(readonlyContainer, 'hidden'); 
        readonlyContainer.textContent = text;     
        addClass(textInputButtons, 'hidden'); 
        isInputMode = false; 
        generateParagraphsFromText(text);
        if (!originalSourceText) {
            originalSourceText = text;
            removeClass(showOriginalSourceBtn, 'hidden'); 
            removeClass(newSessionBtn, 'hidden');
        }
        removeClass(saveWordBtn, 'hidden'); 
        saveCurrentSession(); 
        sendResearchLog('📤_initial_text_submitted', { length: text.length }); // ログ
    }

    if(backToSelectBtn) backToSelectBtn.addEventListener('click', resetToSelection);

    if(selectTextInputBtn) selectTextInputBtn.addEventListener('click', () => {
        sendResearchLog('📝_text_input_mode_selected', {}); // ログ
        showOriginalArea('textInput');
    });

    if(submitTextBtn) submitTextBtn.addEventListener('click', () => {
        const text = originalContainer.value.trim();
        if (!text) return window.toast.error('テキストを入力してください');
        confirmText(text); 
        window.toast.success('元文を確定しました');
    });
    if(cancelTextInputBtn) cancelTextInputBtn.addEventListener('click', () => { 
        sendResearchLog('❌_text_input_cancelled', {}); // ログ
        originalContainer.value = ''; 
        originalContainer.focus(); 
    });

    if(selectFileInput) {
        selectFileInput.addEventListener('click', (e) => {
             sendResearchLog('📁_file_input_mode_selected', {}); // ログ
        });

        selectFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            showOriginalArea('fileLoad'); 
            originalContainer.value = '';
            try {
                if (file.type === "text/plain" || file.name.endsWith('.txt')) {
                    const text = await file.text();
                    processLoadedText(text);
                } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    processLoadedText(result.value);
                } else {
                    processLoadedText("PDF機能は簡易版のため省略しました。テキストかWordをご利用ください。");
                }
            } catch (err) {
                window.toast.error('読み込みエラー', { description: err.message });
                resetToSelection();
            }
        });
    }

    function processLoadedText(text) {
        originalContainer.value = text.trim();
        window.toast.success('ファイルを読み込みました', { description: '「確定」してください。', duration: 4000 });
    }

    if(showOriginalSourceBtn) showOriginalSourceBtn.addEventListener('click', () => {
        sendResearchLog('👁️_original_text_toggled', { showing_original: !isShowingOriginal }); // ログ

        let textToShow = "";
        if (isShowingOriginal) {
            textToShow = paragraphs.map(p => p.text).join('\n');
            showOriginalSourceBtn.textContent = '最初の原文を表示';
            isShowingOriginal = false;
        } else {
            textToShow = originalSourceText;
            showOriginalSourceBtn.textContent = '現在の原文に戻す';
            isShowingOriginal = true;
        }
        originalContainer.value = textToShow;
        readonlyContainer.textContent = textToShow; 
    });

    function generateParagraphsFromText(text) {
        const lines = text.split(/\r?\n/);
        paragraphs = [];
        let idx = 0;
        lines.forEach(line => {
            if (line.trim()) { paragraphs.push({ id: 'p' + (++idx), text: line.trim() }); }
        });
    }

    if(saveWordBtn) saveWordBtn.addEventListener('click', () => {
        sendResearchLog('💾_save_word_opened', {}); // ログ
        saveCurrentSession();
        const content = originalContainer.value;
        if (!content) return window.toast.error('保存するテキストがありません');
        
        const dateStr = new Date().toISOString().slice(0, 10);
        if(saveFileNameInput) {
            saveFileNameInput.value = `reflection_log_${dateStr}`;
            removeClass(saveModalOverlay, 'hidden');
            setTimeout(() => saveFileNameInput.focus(), 100);
        }
    });

    if(confirmSaveBtn) confirmSaveBtn.addEventListener('click', () => {
        let fileName = saveFileNameInput.value.trim();
        sendResearchLog('💾_word_file_saved', { filename: fileName }); // ログ
        if (!fileName) fileName = "reflection_log";
        executeSave(fileName);
        addClass(saveModalOverlay, 'hidden');
    });

    const closeSaveModal = () => addClass(saveModalOverlay, 'hidden');
    if(cancelSaveBtn) cancelSaveBtn.addEventListener('click', closeSaveModal);
    if(cancelSaveBtnTop) cancelSaveBtnTop.addEventListener('click', closeSaveModal);
    if(saveFileNameInput) saveFileNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmSaveBtn.click();
        if (e.key === 'Escape') closeSaveModal();
    });

    function executeSave(fileName) {
        if (!window.docx || !window.saveAs) return window.toast.warning('保存機能準備中');
        if (!fileName.endsWith(".docx")) fileName += ".docx";
        const content = originalContainer.value;
        if (!content) return window.toast.error('保存するテキストがありません');

        const { Document, Packer, Paragraph, TextRun } = window.docx;
        const docChildren = [];
        const lines = content.split(/\n/);
        lines.forEach(line => {
            if(line.trim() === "") {
                docChildren.push(new Paragraph(""));
            } else {
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: line, size: 24 })], 
                    spacing: { after: 200 } 
                }));
            }
        });
        const doc = new Document({ sections: [{ children: docChildren }] });
        Packer.toBlob(doc).then(blob => {
            window.saveAs(blob, fileName);
            window.toast.success(`「${fileName}」を保存しました`);
        }).catch(err => {
            console.error(err);
            window.toast.error("保存エラー", { description: err.message });
        });
    }

    if(sendToAI) sendToAI.addEventListener('click', async () => {
        const currentText = originalContainer.value.trim();
        if (!currentText) return window.toast.warning('テキストがありません');
        if (isInputMode) return window.toast.warning('未確定です');

        sendToAI.textContent = '生成中...';
        sendToAI.disabled = true;
        questionList.innerHTML = `<div class="flex flex-col items-center justify-center h-40 text-gray-500 animate-pulse"><div class="text-2xl mb-2">💬</div><div>AIが思考中...</div></div>`;

        try {
            const response = await fetch('/api/generate', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentText }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error');

            questions = data.map((q, i) => ({
                id: 'q' + i,
                text: q.text,
                targetId: 'p' + (i + 1), 
                targetText: q.targetText,
                type: q.type || 'concrete',
                templateType: q.templateType || 'unknown'
            }));
            
            // --- ログ送信: AI生成フィードバック（テンプレートタイプ付き） ---
            sendResearchLog('🤖_ai_feedback_received', {
                input_text_length: currentText.length,
                generated_count: questions.length,
                template_types: questions.map(q => q.templateType),
                questions_preview: questions.map(q => q.text)
            });

            answers = {}; 
            editingQuestionId = null;
            currentQuestionIndex = 0; 
            renderQuestionList();
            removeClass(showSummaryBtn, 'hidden'); 

            if(editedText) {
                editedText.value = currentText;
                editedText.style.color = '#9ca3af'; 
                const resetStyle = () => {
                    editedText.style.color = ''; 
                    editedText.removeEventListener('focus', resetStyle);
                    editedText.removeEventListener('input', resetStyle);
                };
                editedText.addEventListener('focus', resetStyle);
                editedText.addEventListener('input', resetStyle);
            }
            
            window.toast.success('質問リストを生成しました');
            saveCurrentSession();
        } catch (error) {
            questionList.innerHTML = '<div class="text-red-500 p-4 text-center">エラーが発生しました</div>';
        } finally {
            sendToAI.innerHTML = '<span>✨</span> 質問生成';
            sendToAI.disabled = false;
        }
    });

    function renderQuestionList() {
        if(!questionList) return;
        questionList.innerHTML = '';
        
        if (questions.length === 0) {
            questionList.innerHTML = '<div class="text-center text-gray-400 mt-20 text-sm">質問がここに表示されます</div>';
            return;
        }
        
        if (currentQuestionIndex >= questions.length) {
            currentQuestionIndex = 0;
        }
        
        const q = questions[currentQuestionIndex];
        const displayIndex = currentQuestionIndex + 1;
        const totalCount = questions.length;
        
        const container = document.createElement('div');
        container.className = 'mb-6 scroll-mt-20 transition-all duration-300';
        container.dataset.qid = q.id;
        
        // ナビゲーション
        if (totalCount > 1) {
            const navHeader = document.createElement('div');
            navHeader.className = 'flex items-center justify-between mb-4 pb-2 border-b border-gray-200';
            navHeader.innerHTML = `
                <div class="text-xs font-semibold text-gray-500">質問 ${displayIndex} / ${totalCount}</div>
                <div class="flex gap-2">
                    <button class="prev-question-btn px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition ${displayIndex === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${displayIndex === 1 ? 'disabled' : ''}>← 前へ</button>
                    <button class="next-question-btn px-3 py-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded transition ${displayIndex === totalCount ? 'opacity-50 cursor-not-allowed' : ''}" ${displayIndex === totalCount ? 'disabled' : ''}>次へ →</button>
                </div>
            </div>`;
            container.appendChild(navHeader);
            
            navHeader.querySelector('.prev-question-btn')?.addEventListener('click', () => {
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    renderQuestionList();
                }
            });
            
            navHeader.querySelector('.next-question-btn')?.addEventListener('click', () => {
                if (currentQuestionIndex < questions.length - 1) {
                    currentQuestionIndex++;
                    renderQuestionList();
                }
            });
        }
        
        // 種類判別
        if (q.text.includes('具体的') || q.text.includes('詳しく') || q.text.includes('解像度') || q.text.includes('明確')) {
            q.type = 'concrete';
        } else if (q.text.includes('抽象') || q.text.includes('要点') || q.text.includes('ポイント') || q.text.includes('共通') || q.text.includes('本質')) {
            q.type = 'abstract';
        }

        const aiBubbleWrapper = document.createElement('div');
        aiBubbleWrapper.className = 'flex items-start gap-3 mb-2 group cursor-pointer question-container select-none';
        
        const typeLabel = q.type === 'concrete'
            ? { icon: '🔍', text: '具体化', color: 'bg-blue-100 text-blue-700 border-blue-200', guide: 'その具体例や状態は、どのように見えますか？' }
            : { icon: '☁️', text: '抽象化', color: 'bg-purple-100 text-purple-700 border-purple-200', guide: 'これらに共通する、本当のポイントは何ですか？' };

        aiBubbleWrapper.innerHTML = `
                <div class="left-meta flex flex-col items-center gap-2 mr-3">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm mt-1">Q${displayIndex}</div>
                <span class="text-xs font-semibold text-blue-600" title="${typeLabel.guide.replace(/\"/g, '&quot;')}">${typeLabel.icon} ${typeLabel.text}</span>
            </div>
            <div class="question-bubble relative flex-grow bg-white rounded-2xl rounded-tl-none shadow-sm border border-gray-200 p-5 transition-all duration-200 hover:shadow-md hover:border-indigo-200 max-w-[95%]">
                <div class="bubble-tail"></div>
                <div class="relative z-20">
                    <div class="mb-2">
                        <h3 class="text-base font-bold text-gray-800 leading-snug break-words whitespace-pre-wrap pointer-events-none">${q.text}</h3>
                    </div>
                    <div class="text-xs text-gray-400 mb-2">
                        <span class="whitespace-pre-line">${typeLabel.guide}</span>
                    </div>
                    <div class="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>クリックでハイライト / ダブルクリックで回答</span>
                    </div>
                </div>
            </div>`;
        container.appendChild(aiBubbleWrapper);

        const currentData = answers[q.id] || { answer: '', reflection: '' };
        const answerForm = document.createElement('div');
        answerForm.className = 'hidden ml-12 mr-0 animate-fade-in-down'; 
        
        const isAbstract = q.type === 'abstract';
        const answerPlaceholder = isAbstract
            ? '複数の事例に共通する〇〇という特徴や法則に気づきました'
            : 'はい。理由としては、〇〇という背景があるからです';
        const reflectionPlaceholder = isAbstract
            ? '最初はそれぞれ異なるように見えていたが、〇〇という視点で捉え直すと、実は〇〇という共通点があることに気づきました'
            : '実は〇〇という自分自身の経験・先入観・工程の理解が不十分だったことに気づきました。もしくは、〇〇という新しい視点を得ることができました';
        
        answerForm.innerHTML = `
            <div class="bg-gray-50 rounded-xl p-4 border border-indigo-200 shadow-inner space-y-4">
                <div>
                    <div class="flex items-start gap-2 mb-2">
                        <label class="text-xs font-bold text-indigo-600 flex-shrink-0">A. 回答</label>
                    </div>
                    <textarea class="answer-input w-full p-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" rows="2" placeholder="${answerPlaceholder}">${currentData.answer}</textarea>
                </div>
                <div>
                    <div class="flex items-start gap-2 mb-2">
                        <label class="text-xs font-bold text-gray-500 flex-shrink-0">💭 なぜそう答えたか（自分の思考・気づき）</label>
                    </div>
                    <textarea class="reflection-input w-full p-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 outline-none resize-none" rows="2" placeholder="${reflectionPlaceholder}">${currentData.reflection}</textarea>
                </div>
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button class="cancel-btn text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-2 rounded hover:bg-gray-100 transition-colors">キャンセル</button>
                    <button class="save-btn text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex items-center gap-2"><span>💾</span> 保存する</button>
                </div>
            </div>`;
        
        const answerInput = answerForm.querySelector('.answer-input');
        const reflectionInput = answerForm.querySelector('.reflection-input');
        
        // ★修正: 吹き出し内の回答保存時のログ送信を追加
        answerForm.querySelector('.save-btn').addEventListener('click', () => {
            const ansVal = answerInput.value.trim();
            const refVal = reflectionInput.value.trim();
            if(!ansVal && !refVal) return window.toast.warning("入力が空です");
            
            // ★ここに追加！
            sendResearchLog('💭_reflection_saved', {
                question_id: q.id,
                question_text: q.text,
                answer: ansVal,
                reflection: refVal
            });

            answers[q.id] = { answer: ansVal, reflection: refVal };
            editingQuestionId = null;
            renderQuestionList(); 
            window.toast.success("保存しました");
            saveCurrentSession();
        });
        answerForm.querySelector('.cancel-btn').addEventListener('click', () => { editingQuestionId = null; renderQuestionList(); });
        container.appendChild(answerForm);

        if ((currentData.answer || currentData.reflection) && editingQuestionId !== q.id) {
            const displayContainer = document.createElement('div');
            displayContainer.className = 'mt-3 flex justify-end cursor-pointer group'; 
            
            const card = document.createElement('div');
            card.className = 'relative max-w-[90%] min-w-[300px] w-fit rounded-2xl shadow-md overflow-hidden bg-white border border-gray-200';
            
            let html = '';
            if (currentData.answer) {
                html += `
                <div class="bg-blue-600 text-white p-4">
                    <div class="text-[10px] text-blue-100 font-bold mb-1 opacity-80 flex items-center gap-1"><span>💡</span> 回答</div>
                    <div class="text-sm leading-relaxed whitespace-pre-wrap">${currentData.answer}</div>
                </div>`;
                }
                if (currentData.reflection) {
                    html += `
                    <div class="bg-white text-gray-700 p-4 ${currentData.answer ? 'border-t border-gray-100' : ''}">
                        <div class="text-[10px] text-gray-400 font-bold mb-1 flex items-center gap-1"><span>💭</span> 自分の思考・気づき</div>
                        <div class="text-sm leading-relaxed whitespace-pre-wrap italic">${currentData.reflection}</div>
                    </div>`;
                }
                
                const tailColorClass = currentData.answer ? 'bg-blue-600' : 'bg-white border-r border-t border-gray-200';
                html += `<div class="absolute top-0 -right-2 w-4 h-4 ${tailColorClass} transform rotate-45 z-0"></div>`;

                card.innerHTML = html;
                displayContainer.appendChild(card);
                
                displayContainer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editingQuestionId = q.id;
                    renderQuestionList();
                    highlightSourceText(q.targetText, q.type);
                });
                container.appendChild(displayContainer);
            }

            if (editingQuestionId === q.id) {
                answerForm.classList.remove('hidden');
                setTimeout(() => { answerInput.focus(); container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
            }

            aiBubbleWrapper.addEventListener('click', (ev) => {
                ev.stopPropagation();
                highlightSourceText(q.targetText, q.type);
                
                document.querySelectorAll('.question-bubble').forEach(el => el.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50'));
                const bubble = aiBubbleWrapper.querySelector('.question-bubble');
                if(bubble) bubble.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50');
            });
            aiBubbleWrapper.addEventListener('dblclick', (ev) => {
                ev.stopPropagation();
                editingQuestionId = q.id; 
                renderQuestionList();     
                highlightSourceText(q.targetText, q.type);
            });
            questionList.appendChild(container);
    }

    function highlightSourceText(targetText, type = 'concrete') {
        if (!readonlyContainer) return;
        const fullText = originalContainer.value;
        if (!targetText || targetText.trim() === '') {
            readonlyContainer.textContent = fullText;
            return;
        }

        let index = fullText.indexOf(targetText);
        let matchLength = targetText.length;

        if (index === -1) {
            const trimmed = targetText.trim();
            index = fullText.indexOf(trimmed);
            matchLength = trimmed.length;

            if (index === -1 && targetText.length > 20) {
                const head = targetText.substring(0, 20);
                index = fullText.indexOf(head);
                if (index !== -1) {
                    matchLength = Math.min(targetText.length, fullText.length - index);
                }
            }
            if (index === -1 && targetText.length > 20) {
                const tail = targetText.substring(targetText.length - 20);
                const tailIndex = fullText.indexOf(tail);
                if (tailIndex !== -1) {
                    index = Math.max(0, tailIndex - (targetText.length - 20));
                    matchLength = Math.min(targetText.length, fullText.length - index);
                }
            }
        }

        if (index !== -1) {
            const before = fullText.substring(0, index);
            const match = fullText.substring(index, index + matchLength);
            const after = fullText.substring(index + matchLength);
            
            const style = type === 'abstract'
                ? 'background-color: #f3e8ff; color: #6b21a8; border-bottom: 2px solid #a855f7; font-weight: bold; padding: 0 2px; border-radius: 2px;'
                : 'background-color: #dbeafe; color: #1e40af; border-bottom: 2px solid #3b82f6; font-weight: bold; padding: 0 2px; border-radius: 2px;';

            readonlyContainer.innerHTML = `${escapeHtml(before)}<span style="${style}" id="activeHighlight">${escapeHtml(match)}</span>${escapeHtml(after)}`;
            
            setTimeout(() => {
                const highlightEl = document.getElementById('activeHighlight');
                if (highlightEl) {
                    const containerRect = readonlyContainer.getBoundingClientRect();
                    const highlightRect = highlightEl.getBoundingClientRect();
                    const scrollOffset = highlightRect.top - containerRect.top + readonlyContainer.scrollTop;
                    const targetScroll = scrollOffset - (containerRect.height / 2) + (highlightRect.height / 2);
                    readonlyContainer.scrollTop = Math.max(0, targetScroll);
                }
            }, 100);
        } else {
            readonlyContainer.innerHTML = escapeHtml(fullText);
            window.toast.error("該当箇所が見つかりません", { description: "原文と一致しませんでした。" });
        }
    }

    if(reflectToOriginalBtn) reflectToOriginalBtn.addEventListener('click', () => {
        const newFullText = editedText.value;
        const oldFullText = originalContainer.value; 
        if (!newFullText.trim()) return window.toast.warning('反映するテキストがありません');

        // --- ログ送信: 文章修正 ---
        sendResearchLog('✏️_text_edited', {
            original_text: oldFullText,
            revised_text: newFullText,
            focused_question_id: editingQuestionId || 'none'
        });

        originalContainer.value = newFullText;
        generateParagraphsFromText(newFullText);

        const diffLib = window.Diff || window.jsdiff;
        if (diffLib && diffLib.diffChars) {
            try {
                const diff = diffLib.diffChars(oldFullText, newFullText);
                let html = '';
                diff.forEach((part) => {
                    if (part.added) {
                        html += `<span style="background-color: #fee2e2; color: #b91c1c; text-decoration: underline wavy #ef4444;">${escapeHtml(part.value)}</span>`;
                    } else if (!part.removed) {
                        html += escapeHtml(part.value);
                    }
                });
                readonlyContainer.innerHTML = html;
                window.toast.success('修正箇所を表示しました');
            } catch(e) {
                console.error(e);
                readonlyContainer.textContent = newFullText;
            }
        } else {
            readonlyContainer.textContent = newFullText;
            window.toast.success('全文を更新しました');
        }
        editingQuestionId = null;
        renderQuestionList();
        saveCurrentSession(); 
    });

    if(showSummaryBtn) showSummaryBtn.addEventListener('click', () => {
        sendResearchLog('📊_summary_opened', {}); // ログ
        renderSummary();
        removeClass(summaryModalOverlay, 'hidden');
        if(summaryModalOverlay) summaryModalOverlay.style.opacity = '1';
    });
    if(closeSummaryBtn) closeSummaryBtn.addEventListener('click', () => addClass(summaryModalOverlay, 'hidden'));
    function renderSummary() {
        if(!summaryContent) return;
        summaryContent.innerHTML = '';
        const answeredQuestions = questions.filter(q => answers[q.id] && (answers[q.id].answer || answers[q.id].reflection));
        if (answeredQuestions.length === 0) {
            summaryContent.innerHTML = '<p style="text-align:center; color:#888;">回答がありません。</p>';
            return;
        }
        answeredQuestions.forEach(q => {
            const data = answers[q.id];
            const item = document.createElement('div');
            item.className = 'mb-8 last:mb-0 border-b border-gray-100 pb-6'; 
            let html = `<div class="flex items-center gap-2 mb-3"><span class="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">Q</span><div class="font-bold text-gray-800 text-sm">${q.text}</div></div><div class="ml-4 space-y-3">`;
            if(data.answer) html += `<div class="flex items-start gap-2"><span class="text-blue-500 font-bold text-xs mt-1">A.</span><div class="bg-blue-50 p-3 rounded-lg text-sm text-gray-800 w-full border border-blue-100 whitespace-pre-wrap">${data.answer}</div></div>`;
            if(data.reflection) html += `<div class="flex items-start gap-2"><span class="text-gray-400 font-bold text-xs mt-1">Why</span><div class="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 w-full border border-gray-100 whitespace-pre-wrap italic">💭 ${data.reflection}</div></div>`;
            html += `</div>`;
            item.innerHTML = html;
            summaryContent.appendChild(item);
        });
    }

    if(helpBtn) helpBtn.addEventListener('click', () => {
        sendResearchLog('❓_help_opened', {}); // ログ
        removeClass(helpModalOverlay, 'hidden');
    });
    [closeHelpBtn, closeHelpBtnBottom].forEach(btn => {
        if(btn) btn.addEventListener('click', () => addClass(helpModalOverlay, 'hidden'));
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}