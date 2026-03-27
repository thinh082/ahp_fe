(() => {
  const core = window.homeCore;
  if (!core) return;

  const { authFetch, notify } = core;
  const projectsUI = window.homeUI?.projects;

  function parseWeight(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function normalizeProjectWeights(project) {
    const parsedWeights = [
      project.w_revenue,
      project.w_access,
      project.w_cost,
      project.w_competition,
      project.w_risk,
    ].map(parseWeight);

    const hasAtLeastOneWeight = parsedWeights.some((w) => w !== null);
    const baseWeights = parsedWeights.map((w) => (w !== null ? w : 0.2));
    const sumWeights = baseWeights.reduce((acc, w) => acc + w, 0);
    const weights =
      sumWeights > 0
        ? baseWeights.map((w) => w / sumWeights)
        : [0.2, 0.2, 0.2, 0.2, 0.2];

    return { parsedWeights, hasAtLeastOneWeight, weights };
  }

  function getProjectFilters(project) {
    const filters = {};
    if (project.district) filters.district = project.district;
    if (project.ward) filters.ward = project.ward;
    if (project.street) filters.street = project.street;
    filters.limit = 50;
    return filters;
  }

  document
    .getElementById("btnGetProjects")
    ?.addEventListener("click", async (e) => {
      e.preventDefault();
      if (typeof window.switchView === "function") {
        window.switchView("projects");
      }

      const grid = document.getElementById("projectsGrid");
      if (!grid) return;

      if (projectsUI) {
        projectsUI.renderProjectsLoading(grid);
      }

      try {
        const response = await authFetch("/api/projects?page=1&size=50");
        const projects = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

        window._projectsCache = {};
        projects.forEach((p) => {
          if (p?.id != null) window._projectsCache[p.id] = p;
        });

        if (!projects.length) {
          if (projectsUI) projectsUI.renderProjectsEmpty(grid);
          return;
        }

        if (projectsUI) {
          projectsUI.renderProjectsList(grid, projects);
        }
      } catch (err) {
        if (projectsUI) {
          projectsUI.renderProjectsError(grid, err.message);
        }
      }
    });

  window.deleteProject = async function deleteProject(id, event) {
    event.stopPropagation();
    if (!confirm("Ban co chac chan muon xoa du an nay? Hanh dong nay khong the hoan tac.")) {
      return;
    }

    try {
      await authFetch("/api/projects/" + id, { method: "DELETE" });
      notify("Xoa thanh cong", "success");
      document.getElementById("btnGetProjects")?.click();
    } catch (err) {
      notify("Loi xoa du an: " + (err.message || "Khong xac dinh"), "error");
    }
  };

  window.loadProjectResult = async function loadProjectResult(id) {
    const project = window._projectsCache && window._projectsCache[id];
    if (!project) {
      notify(
        "Khong tim thay thong tin du an trong bo nho. Vui long tai lai danh sach.",
        "error",
      );
      return;
    }

    const { parsedWeights, hasAtLeastOneWeight, weights } = normalizeProjectWeights(project);
    if (!hasAtLeastOneWeight) {
      notify(
        "Du an nay chua co trong so day du. He thong tam dung trong so mac dinh de hien thi ket qua.",
        "warning",
      );
    } else if (parsedWeights.some((w) => w === null)) {
      notify(
        "Du an co mot so trong so thieu/khong hop le. He thong da bo sung va chuan hoa de tiep tuc.",
        "warning",
      );
    }

    const filters = getProjectFilters(project);

    try {
      const favoriteRes = await authFetch(`/api/projects/${id}/favorite-locations`, {
        method: "GET",
      });
      const favoriteIds = Array.isArray(favoriteRes?.items)
        ? favoriteRes.items
            .map((x) => Number(x))
            .filter((x) => Number.isFinite(x))
        : [];

      localStorage.setItem(
        "ahp:lastRequest",
        JSON.stringify({ weights, filters, projectid: id }),
      );
      localStorage.setItem("ahp:lastProjectId", String(id));
      localStorage.setItem("ahp:lastProjectName", project.name || "Du an");
      localStorage.setItem("ahp:lastFavoriteLocationIds", JSON.stringify(favoriteIds));

      window.location.href = "result.html";
    } catch (err) {
      notify(
        "Khong the tai danh sach dia diem yeu thich cua du an: " +
          (err.message || "Khong xac dinh"),
        "error",
      );
    }
  };
})();
