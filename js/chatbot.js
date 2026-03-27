(function () {
    const chatbotHTML = `
        <div id="chatbot-container" class="chatbot-container">
            <div id="chatbot-window" class="chatbot-window hidden">
                <div class="chatbot-header">
                    <span>Tro ly ao</span>
                    <button id="chatbot-close" aria-label="Dong">&times;</button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages"></div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Nhap tin nhan..." />
                    <button id="chatbot-send" aria-label="Gui">➤</button>
                </div>
            </div>
            <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Mo chatbot">💬</button>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", chatbotHTML);

    const toggleBtn = document.getElementById("chatbot-toggle");
    const closeBtn = document.getElementById("chatbot-close");
    const chatWindow = document.getElementById("chatbot-window");
    const inputField = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const messagesContainer = document.getElementById("chatbot-messages");

    let chatHistory = [];
    const API_KEY = "";

    function toggleChat() {
        chatWindow.classList.toggle("hidden");
        if (!chatWindow.classList.contains("hidden")) {
            setTimeout(() => inputField.focus(), 120);
        }
    }

    toggleBtn.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", toggleChat);

    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatInline(text) {
        return text
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    }

    function formatBotMessage(text) {
        const normalized = String(text || "").replace(/\r/g, "").trim();
        if (!normalized) return "<p>Khong co noi dung tra ve.</p>";

        const blocks = normalized
            .split(/\n{2,}/)
            .map((b) => b.trim())
            .filter(Boolean);

        const html = blocks
            .map((block) => {
                const lines = block
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean);
                if (!lines.length) return "";

                if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0])) {
                    const heading = lines[0].replace(/^#{1,3}\s+/, "");
                    return `<h4>${formatInline(escapeHtml(heading))}</h4>`;
                }

                if (lines.every((l) => /^[-*]\s+/.test(l))) {
                    const items = lines
                        .map((l) => l.replace(/^[-*]\s+/, ""))
                        .map((l) => `<li>${formatInline(escapeHtml(l))}</li>`)
                        .join("");
                    return `<ul>${items}</ul>`;
                }

                if (lines.every((l) => /^\d+\.\s+/.test(l))) {
                    const items = lines
                        .map((l) => l.replace(/^\d+\.\s+/, ""))
                        .map((l) => `<li>${formatInline(escapeHtml(l))}</li>`)
                        .join("");
                    return `<ol>${items}</ol>`;
                }

                const paragraph = lines
                    .map((l) => formatInline(escapeHtml(l)))
                    .join("<br>");
                return `<p>${paragraph}</p>`;
            })
            .join("");

        return html || `<p>${formatInline(escapeHtml(normalized))}</p>`;
    }

    function addMessage(text, sender, id = null, options = {}) {
        const { loading = false } = options;
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${sender}${loading ? " loading" : ""}`;
        if (id) msgDiv.id = id;

        const meta = document.createElement("div");
        meta.className = "message-meta";
        if (sender === "user") {
            meta.textContent = "Ban";
        } else if (loading) {
            meta.textContent = "Tro ly AI • dang soan";
        } else {
            meta.textContent = "Tro ly AI";
        }

        const content = document.createElement("div");
        content.className = "message-content";
        if (sender === "bot" && !loading) {
            content.innerHTML = formatBotMessage(text);
        } else {
            content.textContent = text;
        }

        msgDiv.appendChild(meta);
        msgDiv.appendChild(content);
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    const SYSTEM_PROMPT = `Ban la tro ly AI cho he thong DSS chon dia diem kinh doanh bang AHP.

Muc tieu:
- Tra loi tieng Viet, ro rang, khong dai dong.
- Khong bia dat du lieu.
- Neu thieu du lieu dau vao, yeu cau bo sung ro rang.
- Neu thao tac can dang nhap, hay nhac nguoi dung dang nhap.

Dinh dang cau tra loi bat buoc:
- Dung markdown nhe voi tieu de ###
- Dung danh sach - hoac 1.
- Uu tien 3 phan:
  ### Tong quan
  ### Phan tich nhanh
  ### Viec can lam tiep theo`;

    async function callGeminiAPI(history) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const payload = {
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: history,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                console.warn("Failed to parse error response as JSON", e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts) && parts.length > 0) {
            const text = parts
                .map((p) => (typeof p.text === "string" ? p.text : ""))
                .join("\n")
                .trim();
            if (text) return text;
        }

        throw new Error("Du lieu tra ve tu API khong hop le.");
    }

    function getBotReply(text) {
        const t = String(text || "").toLowerCase();
        if (t.includes("xin chao") || t.includes("hello")) return "Xin chao! (Che do Offline) Ban dang quan tam khu vuc nao?";
        if (t.includes("gia") || t.includes("chi phi")) return "Thong tin chi phi thue dang o che do offline. Ban co the thu lai sau.";
        if (t.includes("quan 10")) return "Quan 10 co mat do dan cu cao va nhieu tiem nang kinh doanh.";
        return "Cam on ban. He thong dang o che do offline va se tiep tuc ho tro ban.";
    }

    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        addMessage(text, "user");
        inputField.value = "";

        const loadingId = "loading-" + Date.now();
        addMessage("Dang soan cau tra loi...", "bot", loadingId, { loading: true });

        try {
            const userMessage = { role: "user", parts: [{ text }] };
            const historyToSend = [...chatHistory, userMessage];

            const replyText = await callGeminiAPI(historyToSend);

            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();

            addMessage(replyText, "bot");

            chatHistory.push(userMessage);
            chatHistory.push({ role: "model", parts: [{ text: replyText }] });
        } catch (error) {
            console.error("Gemini API Error details:", error);
            const loadingMsg = document.getElementById(loadingId);
            if (loadingMsg) loadingMsg.remove();

            addMessage(`[API Error]: ${error.message}. Chuyen sang che do offline...`, "bot");
            addMessage(getBotReply(text), "bot");
        }
    }

    sendBtn.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    addMessage(
        "Xin chao! Minh co the ho tro ban phan tich vi tri kinh doanh theo AHP. Ban dang quan tam khu vuc nao?",
        "bot",
    );

    const allowedPages = ["home.html", "map.html"];
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const isAllowedPage = allowedPages.some((p) => currentPage.includes(p));

    if (isAllowedPage) {
        const tooltip = document.createElement("div");
        tooltip.id = "selection-tooltip";
        tooltip.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Dan vao chatbot
        `;
        document.body.appendChild(tooltip);

        let hideTooltipTimer = null;

        function showTooltip(x, y) {
            tooltip.style.left = x + "px";
            tooltip.style.top = y + "px";
            tooltip.classList.add("active");
        }

        function hideTooltip() {
            tooltip.classList.remove("active");
        }

        document.addEventListener("mouseup", function (e) {
            if (e.target.closest("#selection-tooltip")) return;

            clearTimeout(hideTooltipTimer);

            setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection ? selection.toString().trim() : "";

                if (selectedText.length > 0) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    const tooltipX = rect.left + rect.width / 2 - 75;
                    const tooltipY = rect.top - 48;

                    const clampedX = Math.max(8, Math.min(tooltipX, window.innerWidth - 160));
                    const clampedY = Math.max(8, tooltipY);

                    showTooltip(clampedX, clampedY);
                } else {
                    hideTooltip();
                }
            }, 10);
        });

        document.addEventListener("mousedown", function (e) {
            if (!e.target.closest("#selection-tooltip")) {
                hideTooltipTimer = setTimeout(hideTooltip, 120);
            }
        });

        tooltip.addEventListener("mousedown", function (e) {
            e.preventDefault();
        });

        tooltip.addEventListener("click", function () {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";

            if (!selectedText) return;

            if (chatWindow.classList.contains("hidden")) {
                chatWindow.classList.remove("hidden");
            }

            inputField.value = selectedText;
            inputField.focus();

            window.getSelection().removeAllRanges();
            hideTooltip();
        });
    }
})();
