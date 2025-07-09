// scripts/background.js
console.log("Docipedia Service Worker Started/Restarted. State management enabled.");

// "Sổ công việc" - Lưu trạng thái của các tác vụ đang chạy cho từng tab
// Ví dụ: taskStates = { 123: { status: 'running', message: 'Đang gọi AI...' } }
const taskStates = {};

async function fetchFromGemini(text, apiKey) {
    const MODEL_NAME = "gemini-2.5-pro";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
    const prompt = `Bạn là "Docipedia AI", một chuyên gia phân tích văn bản và giải thích các khái niệm phức tạp BẰNG TIẾNG VIỆT. Nhiệm vụ của bạn là đọc kỹ văn bản dưới đây và thực hiện các yêu cầu sau:
1.  **Xác định thuật ngữ:** Phân tích và xác định các thuật ngữ, từ viết tắt, hoặc khái niệm cốt lõi quan trọng nhất bằng tiếng Anh hoặc ngôn ngữ gốc của văn bản.
2.  **Tạo giải thích đa cấp BẰNG TIẾNG VIỆT:** Với MỖI thuật ngữ, tạo 3 cấp độ giải thích sau: \`summary\` (1 câu), \`contextual_explanation\` (1-2 câu trong ngữ cảnh), \`deep_dive\` (3-5 câu chi tiết).
3.  **Định dạng đầu ra:** Trả về kết quả dưới dạng một MẢNG JSON hợp lệ. Key \`term\` phải giữ nguyên thuật ngữ gốc.
QUAN TRỌNG: Phản hồi của bạn CHỈ được chứa mảng JSON này và không có bất kỳ văn bản nào khác.
Văn bản cần phân tích:
---
${text}
---`;
    const requestBody = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } };
    try {
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorBody.error.message}`);
        }
        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        const cleanedJsonString = jsonString.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        return JSON.parse(cleanedJsonString);
    } catch (error) {
        throw error;
    }
}

function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(response);
        });
    });
}

async function updateBadge(text, color) {
    try {
        await chrome.action.setBadgeText({ text: text });
        if (color) await chrome.action.setBadgeBackgroundColor({ color: color });
    } catch (e) {
        console.warn("Update badge failed.", e);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Nhiệm vụ 1: Trả lời câu hỏi về trạng thái từ popup
    if (message.type === 'GET_STATUS') {
        const tabId = message.tabId;
        if (tabId && taskStates[tabId]) {
            sendResponse(taskStates[tabId]);
        } else {
            sendResponse({ status: 'idle' });
        }
        return; // Tác vụ đồng bộ, không cần return true
    }

    // Nhiệm vụ 2: Bắt đầu một quy trình phân tích mới
    if (message.type === 'START_ANALYSIS') {
        (async () => {
            let tab;
            try {
                [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.id) throw new Error("Could not determine active tab.");

                if (taskStates[tab.id]) {
                    console.warn(`Task for tab ${tab.id} is already running. New request ignored.`);
                    return;
                }

                taskStates[tab.id] = { status: 'running', message: 'Bắt đầu...' };
                await updateBadge('...', '#FFA500');

                taskStates[tab.id].message = 'Đang lấy nội dung...';
                const pageContent = await sendMessageToTab(tab.id, { type: 'GET_PAGE_CONTENT' });
                if (!pageContent || !pageContent.text) throw new Error('Không thể trích xuất nội dung.');

                taskStates[tab.id].message = 'Đang lấy API Key...';
                const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
                if (!geminiApiKey) throw new Error('API Key chưa được thiết lập.');

                taskStates[tab.id].message = 'Đang gửi đến AI...';
                const analysisResult = await fetchFromGemini(pageContent.text, geminiApiKey);

                taskStates[tab.id].message = 'Đang đánh dấu trên trang...';
                await sendMessageToTab(tab.id, { type: 'HIGHLIGHT_TERMS', data: analysisResult });

                await updateBadge('OK', '#4CAF50');

            } catch (error) {
                const errorMessage = error.message || "Lỗi không xác định.";
                console.error(`%c[Docipedia-BG] WORKFLOW FAILED: ${errorMessage}`, 'color: red; font-weight: bold;');
                await updateBadge('ERR', '#F44336');
                if (tab && tab.id) {
                    sendMessageToTab(tab.id, { type: 'API_ERROR', error: errorMessage }).catch(() => { });
                }
            } finally {
                if (tab && tab.id) {
                    delete taskStates[tab.id];
                }
                setTimeout(() => updateBadge('', ''), 5000);
            }
        })();

        return true;
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (taskStates[tabId]) {
        console.log(`Tab ${tabId} closed, cleaning up task state.`);
        delete taskStates[tabId];
    }
});