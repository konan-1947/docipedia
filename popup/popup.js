// popup.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Các biến và hàm cơ bản (không đổi) ---
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

    function showView(viewName) {
        Object.values(views).forEach(view => view.style.display = 'none');
        if (views[viewName]) {
            views[viewName].style.display = 'block';
        }
    }

    function checkApiKeyAndShowMain() {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) showView('mainActionView');
            else showView('apiKeyView');
        });
    }

    // --- LOGIC MỚI: THEO DÕI TRẠNG THÁI TRỰC TIẾP ---
    let statusInterval; // Biến để lưu trữ vòng lặp

    // Hàm cập nhật trạng thái, giờ có thêm logic cho vòng lặp
    function updateStatus(status) {
        if (status && status.status === 'running') {
            showView('loadingView');
            loadingText.textContent = status.message || 'Đang xử lý...';

            // Nếu chưa có vòng lặp, hãy tạo một cái
            if (!statusInterval) {
                console.log("[Popup] Starting status polling.");
                statusInterval = setInterval(checkCurrentStatus, 1000); // Hỏi lại trạng thái mỗi giây
            }
        } else {
            // Nếu công việc đã xong (status là 'idle')
            console.log("[Popup] Task is idle. Stopping status polling.");
            clearInterval(statusInterval); // Dừng vòng lặp
            statusInterval = null;
            checkApiKeyAndShowMain(); // Hiển thị lại màn hình chính
        }
    }

    // Hàm hỏi background về trạng thái (được gọi lặp lại)
    async function checkCurrentStatus() {
        try {
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!currentTab) {
                updateStatus({ status: 'idle' });
                return;
            }

            chrome.runtime.sendMessage({ type: 'GET_STATUS', tabId: currentTab.id }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Could not get status from background. Stopping poll.", chrome.runtime.lastError.message);
                    updateStatus({ status: 'idle' });
                    return;
                }
                // Gọi hàm updateStatus để xử lý kết quả
                updateStatus(response);
            });
        } catch (e) {
            console.error("Error checking status:", e);
            updateStatus({ status: 'idle' }); // Dừng lại nếu có lỗi
        }
    }

    // Chạy hàm kiểm tra trạng thái lần đầu tiên khi popup được mở
    checkCurrentStatus();

    // --- SỰ KIỆN CLICK (giữ nguyên) ---
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) chrome.storage.sync.set({ geminiApiKey: apiKey }, () => showView('mainActionView'));
    });

    changeApiKeyBtn.addEventListener('click', () => showView('apiKeyView'));

    // Khi nhấn nút phân tích, chỉ cần gửi lệnh và bắt đầu vòng lặp theo dõi
    analyzeBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'START_ANALYSIS' });
        // Cập nhật giao diện ngay lập tức và bắt đầu theo dõi
        updateStatus({ status: 'running', message: 'Bắt đầu...' });
    });

    // Dọn dẹp vòng lặp khi popup bị đóng
    window.addEventListener('unload', () => {
        if (statusInterval) {
            clearInterval(statusInterval);
        }
    });
});