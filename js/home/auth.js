(() => {
  const core = window.homeCore;
  if (!core) return;

  const { API_BASE, authFetch, notify } = core;

  const authModal = document.getElementById("authModal");
  const loginPanel = document.getElementById("loginPanel");
  const regPanel = document.getElementById("registerPanel");
  const openAuthBtnUI = document.getElementById("openAuthBtn");
  const userProfileDropdown = document.getElementById("userProfileDropdown");
  const dropdownUserName = document.getElementById("dropdownUserName");
  const dropdownUserEmail = document.getElementById("dropdownUserEmail");

  function openAuth(showRegister = false) {
    if (!authModal || !loginPanel || !regPanel) return;
    authModal.classList.add("open");
    loginPanel.classList.toggle("hidden", showRegister);
    regPanel.classList.toggle("hidden", !showRegister);
  }

  function closeAuth() {
    if (authModal) authModal.classList.remove("open");
  }

  function setLoggedInUI(user) {
    const name = user?.fullname || user?.hoTen || user?.name || "Thanh vien";
    const email = user?.email || "@";

    if (openAuthBtnUI) openAuthBtnUI.classList.add("hidden");
    if (userProfileDropdown) userProfileDropdown.classList.remove("hidden");
    if (dropdownUserName) dropdownUserName.textContent = name;
    if (dropdownUserEmail) dropdownUserEmail.textContent = email;

    closeAuth();
  }

  function setLoggedOutUI() {
    if (openAuthBtnUI) openAuthBtnUI.classList.remove("hidden");
    if (userProfileDropdown) userProfileDropdown.classList.add("hidden");
  }

  window.homeAuth = {
    openAuth,
    closeAuth,
    setLoggedInUI,
    setLoggedOutUI,
  };
  window.setLoggedInUI = setLoggedInUI;
  window.setLoggedOutUI = setLoggedOutUI;

  ["openAuthBtn", "openAuthBtn2", "openAuthBtn3"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => openAuth(false));
  });
  document.getElementById("closeAuthBtn")?.addEventListener("click", closeAuth);
  document.getElementById("closeAuthBtn2")?.addEventListener("click", closeAuth);
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuth();
  });

  document.getElementById("showRegisterBtn")?.addEventListener("click", () => {
    if (!loginPanel || !regPanel) return;
    loginPanel.classList.add("hidden");
    regPanel.classList.remove("hidden");
  });

  document.getElementById("showLoginBtn")?.addEventListener("click", () => {
    if (!loginPanel || !regPanel) return;
    regPanel.classList.add("hidden");
    loginPanel.classList.remove("hidden");
  });

  (async function checkSession() {
    try {
      const user = await authFetch("/api/XacThucTaiKhoan/me");
      if (user) setLoggedInUI(user);
      else setLoggedOutUI();
    } catch (_) {
      setLoggedOutUI();
    }
  })();

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    try {
      await authFetch("/api/XacThucTaiKhoan/logout", { method: "POST" });
    } catch (_) {
      // no-op
    }
    setLoggedOutUI();
  });

  document.getElementById("loginBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("loginBtn");
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value.trim();

    if (!email || !password) {
      notify("Vui long nhap day du Email va Mat khau.", "warning");
      return;
    }

    btn.disabled = true;
    btn.innerHTML =
      '<span class="material-symbols-outlined text-base leading-none animate-spin">progress_activity</span> Dang xu ly...';

    try {
      await authFetch("/api/XacThucTaiKhoan/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const user = await authFetch("/api/XacThucTaiKhoan/me");
      setLoggedInUI(user);
      notify("Dang nhap thanh cong!", "success");
    } catch (err) {
      notify("Dang nhap that bai: " + err.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML =
        '<span class="material-symbols-outlined text-base leading-none">login</span> Dang nhap';
    }
  });

  document.getElementById("googleLoginBtn")?.addEventListener("click", () => {
    const redirectUri =
      window.location.origin +
      window.location.pathname.replace("home.html", "") +
      "google-callback.html";
    window.location.href = `${API_BASE}/api/XacThucTaiKhoan/google-login?redirect_uri=${encodeURIComponent(redirectUri)}`;
  });

  document.getElementById("registerBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("registerBtn");
    const fullname = document.getElementById("registerFullname")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    const phone = document.getElementById("registerPhone")?.value.trim();
    const password = document.getElementById("registerPassword")?.value.trim();
    const passwordConfirm = document
      .getElementById("registerPasswordConfirm")
      ?.value.trim();

    if (!fullname || !email || !phone || !password) {
      notify("Vui long nhap day du thong tin.", "warning");
      return;
    }

    if (password !== passwordConfirm) {
      notify("Mat khau xac nhan khong khop.", "warning");
      return;
    }

    btn.disabled = true;
    btn.innerHTML =
      '<span class="material-symbols-outlined text-base leading-none animate-spin">progress_activity</span> Dang xu ly...';

    try {
      await authFetch("/api/XacThucTaiKhoan/register", {
        method: "POST",
        body: JSON.stringify({ fullname, email, sodienthoai: phone, password }),
      });

      await authFetch("/api/XacThucTaiKhoan/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const user = await authFetch("/api/XacThucTaiKhoan/me");
      setLoggedInUI(user);
      notify("Dang ky thanh cong!", "success");
    } catch (err) {
      notify("Dang ky that bai: " + err.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML =
        '<span class="material-symbols-outlined text-base leading-none">person_add</span> Tao tai khoan';
    }
  });
})();
