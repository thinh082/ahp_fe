
(function () {
    // Inject CSS if not present (optional, but good for portability)
    // For now we assume CSS is in style.css, but we can inject HTML structure here.

    const chatbotHTML = `
        <div id="chatbot-container" class="chatbot-container">
            <div id="chatbot-window" class="chatbot-window hidden">
                <div class="chatbot-header">
                    <span>Trợ lý ảo</span>
                    <button id="chatbot-close">&times;</button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="message bot">
                        Xin chào! Tôi có thể giúp gì cho bạn về việc tìm kiếm vị trí kinh doanh?
                    </div>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Nhập tin nhắn..." />
                    <button id="chatbot-send">➤</button>
                </div>
            </div>
            <button id="chatbot-toggle" class="chatbot-toggle">
                💬
            </button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Elements
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const chatWindow = document.getElementById('chatbot-window');
    const inputField = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const messagesContainer = document.getElementById('chatbot-messages');

    // Toggle Chat
    function toggleChat() {
        chatWindow.classList.toggle('hidden');
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Chat History for context
    let chatHistory = [];
    const API_KEY = "AIzaSyAR56zud9NWf_YvT8Fq7e2bZ7t63Ip8UH8"; // User Provided API Key

    // Send Message
    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        // User Message
        addMessage(text, 'user');
        inputField.value = '';

        // Add Loading Message
        const loadingId = 'loading-' + Date.now();
        addMessage('Đang nhập...', 'bot', loadingId);

        try {
            // Add user message to history buffer
            const userMessage = { role: "user", parts: [{ text: text }] };
            const historyToSend = [...chatHistory, userMessage];

            const replyText = await callGeminiAPI(historyToSend);

            // Remove loading message
            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();

            addMessage(replyText, 'bot');

            // Update history only on success
            chatHistory.push(userMessage);
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });

        } catch (error) {
            console.error("Gemini API Error details:", error);
            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();

            // Fallback to mock response with error details for debugging
            console.log("Switching to mock response due to API error.");
            addMessage(`[API Error]: ${error.message}. Chuyển sang chế độ offline...`, 'bot');
            const fallbackReply = getBotReply(text);
            addMessage(fallbackReply, 'bot');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function addMessage(text, sender, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        if (id) msgDiv.id = id;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    const SYSTEM_PROMPT = `Bạn là trợ lý AI cho hệ thống DSS chọn địa điểm kinh doanh bằng AHP.
    Tên dự án: Hệ hỗ trợ ra quyết định chọn địa điểm kinh doanh (DSS - Decision Support System).
### D. Bản chất bài toán & Xử lý dữ liệu (Bổ sung từ Kiến trúc Dự án):
1. Bản chất DSS: 
   - [cite_start]Đây là bài toán ra quyết định đa tiêu chí (MCDM). 
   - [cite_start]Nhiệm vụ cốt lõi là chuẩn hóa, trừu tượng hóa và định lượng các dữ liệu thực tế (facts) thành điểm số để hỗ trợ quyết định.

2. Cấu trúc AHP 3 Tầng:
   - [cite_start]Tầng 1 (Mục tiêu): Lựa chọn địa điểm kinh doanh.
   - [cite_start]Tầng 2 (Tiêu chí cấp cao): 5 nhóm cốt lõi (C1-C5)].
   - [cite_start]Tầng 3 (Tiêu chí con/Dữ liệu thực tế): Các chỉ số như thu nhập (avg_income), mật độ dân (population_density), giá thuê (rent_cost), số đối thủ (competitors)....
   - [cite_start]Quy tắc: Người dùng chỉ chấm điểm so sánh cặp ở Tầng 2. Hệ thống tự động tính điểm Tầng 3 từ Database.

3. Logic Chuẩn hóa Tiêu chí (Quan trọng):
   - Chỉ số Thuận (Positive): Càng lớn càng tốt (Thu nhập, mật độ dân, hạ tầng, traffic). [cite_start]Công thức: $x' = (x - min) / (max - min)$.
   - Chỉ số Nghịch (Negative): Càng lớn càng xấu (Giá thuê, số đối thủ, mức độ rủi ro). [cite_start]Công thức: $x' = (max - x) / (max - min)$].
   - [cite_start]DB chỉ lưu dữ liệu thô (facts), không lưu điểm AHP hay quyết định cuối cùng.

4. Vai trò của AI & Engine:
   - [cite_start]AHP: Tính trọng số, kiểm tra nhất quán (CR < 10%), phân tích kịch bản (What-if).
   - [cite_start]AI (Clustering/Chatbot): Chỉ đóng vai trò hỗ trợ, giải thích, không thay thế Decision Engine đưa ra quyết định cuối cùng.

5. Luồng dữ liệu chuẩn:
   - [cite_start]DB (Facts) -> Chuẩn hóa (Min-Max) -> AHP (Trọng số người dùng) -> Decision Engine -> Giải thích & Bản đồ.

Mô tả dự án:
- Đây là dự án Backend FastAPI cho Hệ Hỗ Trợ Ra Quyết Định (Decision Support System).
- Mục tiêu chính: phân tích và xếp hạng địa điểm kinh doanh bằng phương pháp AHP, kết hợp gom cụm (K-Means) để hiển thị trực quan trên bản đồ.
- Hệ thống có 3 nhóm chức năng chính:
  1) Phân tích địa điểm (AHP + clustering)
  2) Quản lý Project (tạo/xóa/danh sách/favorite locations)
  3) Quản lý tài khoản người dùng (đăng nhập, hồ sơ cá nhân)

Nguyên tắc chung:
- Trả lời bằng tiếng Việt, rõ ràng, ngắn gọn, ưu tiên hành động.
- Không bịa dữ liệu. Chỉ dùng dữ liệu có từ backend hoặc từ người dùng.
- Nếu thiếu thông tin đầu vào, yêu cầu đúng dữ liệu còn thiếu.
- Với thao tác cần đăng nhập, nhắc người dùng đăng nhập nếu chưa có phiên/cookie hợp lệ.

A. Phân tích địa điểm (AHP):
- 5 tiêu chí: C1 doanh thu, C2 tiếp cận, C3 chi phí, C4 cạnh tranh, C5 rủi ro & ổn định.
- Ma trận so sánh cặp phải 5x5, đường chéo = 1.
- Chỉ chấp nhận ma trận nhất quán khi CR < 0.1.
- AHP score theo thang 1-9.
- Đánh giá:
  - >= 7.0: NÊN MỞ
  - >= 5.0 và < 7.0: CÂN NHẮC
  - < 5.0: KHÔNG NÊN
- Khi có kết quả, luôn tóm tắt:
  1) CR và trạng thái nhất quán
  2) Top địa điểm nổi bật
  3) Tiêu chí đóng góp mạnh/yếu
  4) Khuyến nghị tiếp theo

B. Quản lý Project:
- Hỗ trợ:
  - Xem danh sách project (lọc tên + phân trang)
  - Tạo project mới
  - Xóa project
  - Thêm/xóa địa điểm yêu thích
  - Lấy danh sách địa điểm yêu thích theo project
- Khi xử lý project, luôn trả: kết quả + lý do + bước tiếp theo.

C. Hồ sơ cá nhân:
- Hỗ trợ:
  - Xem thông tin tài khoản hiện tại
  - Cập nhật họ tên, số điện thoại, mật khẩu
- Nếu dữ liệu cập nhật rỗng, thông báo “No data to update”.

Quy tắc phản hồi:
- Nếu lỗi backend, diễn giải lỗi dễ hiểu và gợi ý cách sửa.
- Không tiết lộ token, mật khẩu, khóa bí mật, dữ liệu nhạy cảm.`;

    async function callGeminiAPI(history) {
        // Using gemini-2.5-flash as discovered from diagnostics
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const payload = {
            system_instruction: {
                parts: { text: SYSTEM_PROMPT }
            },
            contents: history
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                // Ignore parsing errors
                console.warn("Failed to parse error response as JSON", e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        // Extract text from Gemini response structure
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Dữ liệu trả về từ API không hợp lệ.");
        }
    }

    // Mock local reply for fallback
    function getBotReply(text) {
        text = text.toLowerCase();
        if (text.includes('xin chào') || text.includes('hello')) return 'Chào bạn! (Chế độ Offline) Bạn cần tư vấn về khu vực nào?';
        if (text.includes('giá') || text.includes('chi phí')) return 'Thông tin về chi phí thuê mặt bằng đang được cập nhật (Offline mode).';
        if (text.includes('quận 10')) return 'Quận 10 có mật độ dân cư cao và nhiều tiềm năng kinh doanh.';
        return 'Cảm ơn câu hỏi của bạn. Hệ thống đang phân tích dữ liệu (Offline response).';
    }

    // ── Selection-to-Chat Feature (only on home.html & map.html) ──
    const allowedPages = ['home.html', 'map.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isAllowedPage = allowedPages.some(p => currentPage.includes(p));

    if (isAllowedPage) {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.id = 'selection-tooltip';
        tooltip.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Dán vào chatbot
        `;
        document.body.appendChild(tooltip);

        let hideTooltipTimer = null;

        function showTooltip(x, y) {
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
            tooltip.classList.add('active');
        }

        function hideTooltip() {
            tooltip.classList.remove('active');
        }

        document.addEventListener('mouseup', function (e) {
            // Don't trigger if clicking the tooltip itself
            if (e.target.closest('#selection-tooltip')) return;

            clearTimeout(hideTooltipTimer);

            // Small delay to let selection finalize
            setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection ? selection.toString().trim() : '';

                if (selectedText.length > 0) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    // Position tooltip above the selection, centered
                    const tooltipX = rect.left + rect.width / 2 - 75; // ~75 = half tooltip width
                    const tooltipY = rect.top - 48; // 48px above selection (Viewport relative)

                    // Clamp to viewport
                    const clampedX = Math.max(8, Math.min(tooltipX, window.innerWidth - 160));
                    const clampedY = Math.max(8, tooltipY);

                    showTooltip(clampedX, clampedY);
                } else {
                    hideTooltip();
                }
            }, 10);
        });

        // Hide on click anywhere else
        document.addEventListener('mousedown', function (e) {
            if (!e.target.closest('#selection-tooltip')) {
                hideTooltipTimer = setTimeout(hideTooltip, 120);
            }
        });

        // Handle tooltip click: paste to chatbot
        tooltip.addEventListener('mousedown', function (e) {
            e.preventDefault(); // prevent losing selection
        });

        tooltip.addEventListener('click', function () {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : '';

            if (!selectedText) return;

            // Open chatbot window if hidden
            if (chatWindow.classList.contains('hidden')) {
                chatWindow.classList.remove('hidden');
            }

            // Paste text into input
            inputField.value = selectedText;
            inputField.focus();

            // Deselect text and hide tooltip
            window.getSelection().removeAllRanges();
            hideTooltip();
        });
    }

})();
