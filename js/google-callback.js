// Trang callback: lấy code từ URL và gọi BE để đổi token
(function () {
  const msgEl = document.getElementById("callbackMsg");

  function setMsg(text, color) {
    if (!msgEl) return;
    msgEl.textContent = text;
    if (color) msgEl.style.color = color;
  }

  // Lấy code từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  // Redirect URI phải khớp y hệt lúc gọi Google https://thinh082.github.io/ahp_fe
  const redirectUri = "http://127.0.0.1:5500/google-callback.html";

  if (!code) {
    setMsg("Không tìm thấy mã xác thực (code).", "#b45309");
    return;
  }

  async function handleGoogleLogin(authCode, redirectUriValue) {
    try {
      setMsg("Đang đăng nhập...", "#334155");

      const response = await fetch(
        `${API_BASE_URL}/api/XacThucTaiKhoan/google-callback?code=${encodeURIComponent(
          authCode
        )}&redirect_uri=${encodeURIComponent(redirectUriValue)}`,
        { method: "GET", credentials: "include" }
      );

      const data = await response.json();

      if (response.ok) {
        // Token nằm trong HttpOnly cookie do BE set
        localStorage.setItem("user_info", JSON.stringify(data.user || {}));

        setMsg("Đăng nhập thành công. Đang chuyển hướng...", "#15803d");
        window.location.href = "home.html";
      } else {
        setMsg(`Đăng nhập thất bại: ${data.detail || "Không rõ lỗi"}`, "#b91c1c");
      }
    } catch (error) {
      setMsg("Lỗi kết nối tới backend.", "#b91c1c");
      console.error("Google login error:", error);
    }
  }

  handleGoogleLogin(code, redirectUri);
})();
