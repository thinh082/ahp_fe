(() => {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function projectCardHtml(project) {
    const id = Number(project?.id);
    const safeId = Number.isFinite(id) ? id : 0;
    const name = escapeHtml(project?.name || "Du an khong ten");
    const description = escapeHtml(project?.description || "Chua cap nhat mo ta.");

    return `
      <div onclick="loadProjectResult(${safeId})" class="group cursor-pointer bg-white p-6 rounded-2xl border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex flex-col min-h-[220px]">
        <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <span class="material-symbols-outlined">folder</span>
        </div>
        <h3 class="font-bold text-lg text-slate-900 mb-2 truncate">${name}</h3>
        <p class="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">${description}</p>
        <div class="flex items-center justify-between mt-auto">
          <div class="flex items-center text-primary text-sm font-semibold group-hover:translate-x-1 transition-transform">
            Xem ket qua <span class="material-symbols-outlined text-base ml-1">arrow_forward</span>
          </div>
          <button onclick="deleteProject(${safeId}, event)" class="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors" title="Xoa du an">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderProjectsLoading(grid) {
    if (!grid) return;
    grid.innerHTML =
      '<div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-slate-500"><span class="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span><p>Dang tai danh sach du an...</p></div>';
  }

  function renderProjectsEmpty(grid) {
    if (!grid) return;
    grid.innerHTML =
      '<div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">Ban chua tao du an nao.</div>';
  }

  function renderProjectsError(grid, errorMessage) {
    if (!grid) return;
    grid.innerHTML = `<div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-red-500 bg-red-50 rounded-2xl border border-red-200">Loi lay danh sach du an: ${escapeHtml(errorMessage)}</div>`;
  }

  function renderProjectsList(grid, projects) {
    if (!grid) return;
    grid.innerHTML = projects.map(projectCardHtml).join("");
  }

  function setProfileDisplay(data) {
    const profileNameEl = document.getElementById("profileName");
    const profileEmailEl = document.getElementById("profileEmail");
    const nameInput = document.getElementById("profileFullNameInput");
    const phoneInput = document.getElementById("profilePhoneInput");

    if (profileNameEl) {
      profileNameEl.textContent =
        data?.fullname || data?.hoTen || data?.name || "Thanh vien chua co ten";
    }
    if (profileEmailEl) {
      profileEmailEl.textContent = data?.email || "Khong co email";
    }
    if (nameInput) {
      nameInput.value = data?.fullname || data?.hoTen || data?.name || "";
    }
    if (phoneInput) {
      phoneInput.value = data?.sodienthoai || data?.phone || "";
    }
  }

  function setProfileError(errorMessage) {
    const profileNameEl = document.getElementById("profileName");
    const profileEmailEl = document.getElementById("profileEmail");
    if (profileNameEl) profileNameEl.textContent = "Loi truy xuat...";
    if (profileEmailEl) profileEmailEl.textContent = errorMessage || "Khong xac dinh";
  }

  function setProfileUpdateButtonState(buttonEl, isLoading) {
    if (!buttonEl) return;
    if (isLoading) {
      buttonEl.disabled = true;
      buttonEl.innerHTML =
        '<span class="material-symbols-outlined text-base animate-spin">progress_activity</span> Dang luu...';
      return;
    }
    buttonEl.disabled = false;
    buttonEl.innerHTML =
      '<span class="material-symbols-outlined text-base">save</span> Cap nhat thong tin';
  }

  window.homeUI = {
    escapeHtml,
    projects: {
      renderProjectsLoading,
      renderProjectsEmpty,
      renderProjectsError,
      renderProjectsList,
    },
    profile: {
      setProfileDisplay,
      setProfileError,
      setProfileUpdateButtonState,
    },
  };
})();
