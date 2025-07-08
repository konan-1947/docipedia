// scripts/background.js
console.log("Docipedia Service Worker: API Relay Ready.");

/**
 * Thực hiện cuộc gọi đến Gemini API.
 */
async function fetchFromGemini(text, apiKey) {
    // Sử dụng model mới và phiên bản API beta để có các tính năng mới nhất
    const MODEL_NAME = "gemini-2.5-pro";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const prompt = `Bạn là "Docipedia AI", một chuyên gia phân tích văn bản và giải thích các khái niệm phức tạp BẰNG TIẾNG VIỆT. Nhiệm vụ của bạn là đọc kỹ văn bản dưới đây và thực hiện các yêu cầu sau:

1.  **Xác định thuật ngữ:** Phân tích và xác định tối đa 15 thuật ngữ, từ viết tắt, hoặc khái niệm cốt lõi quan trọng nhất bằng tiếng Anh hoặc ngôn ngữ gốc của văn bản.
2.  **Tạo giải thích đa cấp BẰNG TIẾNG VIỆT:** Với MỖI thuật ngữ, tạo 3 cấp độ giải thích sau: \`summary\` (1 câu), \`contextual_explanation\` (1-2 câu trong ngữ cảnh), \`deep_dive\` (3-5 câu chi tiết).
3.  **Định dạng đầu ra:** Trả về kết quả dưới dạng một MẢNG JSON hợp lệ. Key \`term\` phải giữ nguyên thuật ngữ gốc.

QUAN TRỌNG: Phản hồi của bạn CHỈ được chứa mảng JSON này và không có bất kỳ văn bản nào khác.

Văn bản cần phân tích:
---
${text}
---`;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.2
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API Error ${response.status}: ${errorBody.error.message}`);
        }
        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        const cleanedJsonString = jsonString.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');

        return JSON.parse(cleanedJsonString);

    } catch (error) {
        console.error("[Docipedia-BG] Lỗi trong fetchFromGemini:", error);
        throw error; // Ném lỗi ra để onMessage listener có thể bắt và gửi về popup
    }
}

/**
 * Listener chính: Chỉ còn một nhiệm vụ là nhận lệnh, gọi API và trả kết quả về.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CALL_GEMINI_API') {
        console.log('[Docipedia-BG] Received request to call Gemini API.');
        (async () => {
            try {
                const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
                if (!geminiApiKey) {
                    throw new Error('API Key chưa được thiết lập.');
                }

                const result = await fetchFromGemini(message.content, geminiApiKey);

                console.log('[Docipedia-BG] Gemini API call successful. Sending result back to popup.');
                console.table(result);

                sendResponse(result); // Trả kết quả thành công về cho popup

            } catch (error) {
                console.error('[Docipedia-BG] Failed to process API call:', error.message);
                sendResponse({ error: error.message }); // Trả đối tượng lỗi về cho popup
            }
        })();

        return true; // Bắt buộc phải có vì đây là tác vụ bất đồng bộ.
    }
});