(() => {
  const core = window.homeCore;
  if (!core) return;

  const { authFetch, notify } = core;
  const profileUI = window.homeUI?.profile;

  document.getElementById("btnGetUserInfo")?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (typeof window.switchView === "function") {
      window.switchView("profile");
    }

    try {
      const data = await authFetch("/api/XacThucTaiKhoan/me");
      if (profileUI) {
        profileUI.setProfileDisplay(data);
      }
    } catch (err) {
      if (profileUI) {
        profileUI.setProfileError(err.message);
      }
    }
  });

  document.getElementById("btnUpdateProfile")?.addEventListener("click", async () => {
    const btn = document.getElementById("btnUpdateProfile");
    const fullname = document.getElementById("profileFullNameInput")?.value.trim();
    const phone = document.getElementById("profilePhoneInput")?.value.trim();
    const password = document.getElementById("profilePasswordInput")?.value;

    if (!fullname) {
      notify("Ho ten khong duoc de trong.", "warning");
      return;
    }

    try {
      if (profileUI) {
        profileUI.setProfileUpdateButtonState(btn, true);
      }

      const payload = { fullname, sodienthoai: phone };
      if (password) payload.password = password;

      await authFetch("/api/XacThucTaiKhoan/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      notify("Cap nhat thong tin thanh cong!", "success");
      document.getElementById("profilePasswordInput").value = "";

      const user = await authFetch("/api/XacThucTaiKhoan/me");
      window.homeAuth?.setLoggedInUI?.(user);
      if (profileUI) {
        profileUI.setProfileDisplay(user);
      }
    } catch (err) {
      notify("Loi cap nhat: " + err.message, "error");
    } finally {
      if (profileUI) {
        profileUI.setProfileUpdateButtonState(btn, false);
      }
    }
  });
})();
