// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
    const views = {
        apiKeyView: document.getElementById('apiKeyView'),
        mainActionView: document.getElementById('mainActionView'),
        loadingView: document.getElementById('loadingView')
    };
    const loadingText = document.querySelector('#loadingView p');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const changeApiKeyBtn = document.getElementById('changeApiKeyBtn');

    // Hàm hiển thị view tương ứng
    function showView(viewName) {
        Object.values(views).forEach(view => view.style.display = 'none');
        if (views[viewName]) {
            views[viewName].style.display = 'block';
        }
    }

    // Hàm cập nhật trạng thái trên giao diện popup
    function updateLoadingStatus(text) {
        if (loadingText) {
            loadingText.textContent = text;
        }
        console.log(`[Popup Status] ${text}`);
    }

    // Kiểm tra API key khi mở popup
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            showView('mainActionView');
        } else {
            showView('apiKeyView');
        }
    });

    // Lưu API Key
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.sync.set({ geminiApiKey: apiKey }, () => showView('mainActionView'));
        }
    });

    // Chuyển sang màn hình đổi API Key
    changeApiKeyBtn.addEventListener('click', () => showView('apiKeyView'));

    // Bắt đầu toàn bộ quy trình khi nhấn nút
    analyzeBtn.addEventListener('click', async () => {
        showView('loadingView');
        let tab;

        try {
            // Bước 1: Lấy tab đang hoạt động
            updateLoadingStatus('Bước 1: Tìm tab hoạt động...');
            [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) {
                throw new Error("Không tìm thấy tab hoạt động.");
            }

            // Bước 2: Gửi lệnh và chờ content script lấy nội dung
            updateLoadingStatus('Bước 2: Đang lấy nội dung trang...');
            const pageContentResponse = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
            if (!pageContentResponse || !pageContentResponse.text) {
                throw new Error('Không thể trích xuất nội dung từ trang này.');
            }
            updateLoadingStatus(`Bước 2.1: Đã lấy ${pageContentResponse.text.length} ký tự.`);

            // Bước 3: Gửi nội dung cho background script để gọi API
            updateLoadingStatus('Bước 3: Đang gửi đến AI, vui lòng đợi...');
            const analysisResult = await chrome.runtime.sendMessage({
                type: 'CALL_GEMINI_API',
                content: pageContentResponse.text
            });
            if (analysisResult && analysisResult.error) {
                // Nếu background trả về đối tượng lỗi, ném lỗi ra
                throw new Error(analysisResult.error);
            }
            if (!analysisResult) {
                throw new Error('AI không trả về kết quả hợp lệ.');
            }
            updateLoadingStatus(`Bước 3.1: AI đã trả về ${analysisResult.length} thuật ngữ.`);

            // Bước 4: Gửi dữ liệu để content script thực hiện highlight
            updateLoadingStatus('Bước 4: Đang đánh dấu trên trang...');
            await chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT_TERMS', data: analysisResult });

            // Bước 5: Hoàn thành
            updateLoadingStatus('Hoàn thành!');
            setTimeout(() => window.close(), 1500); // Đợi 1.5 giây rồi đóng popup

        } catch (error) {
            const errorMessage = error.message || "Lỗi không xác định.";
            console.error("[Popup] Workflow failed:", errorMessage);
            updateLoadingStatus(`Lỗi: ${errorMessage}`);
            // Không tự đóng popup khi có lỗi để người dùng có thể đọc
        }
    });
});