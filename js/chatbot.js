
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
    const API_KEY = "AIzaSyD9n1Xc8hOx5158dbv6tv8nppexOf0yYQs"; // Updated User Key

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
            console.error("Gemini API Error:", error);
            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();

            // Fallback to mock response
            console.log("Switching to mock response due to API error.");
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

    async function callGeminiAPI(history) {
        // Using gemini-1.5-flash as preferred in user snippet (or fallback to user preferred)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const payload = {
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Extract text from Gemini response structure
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "Tôi không hiểu câu hỏi của bạn.";
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

})();
