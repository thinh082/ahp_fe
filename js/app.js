
const criteria = [
  "Tiềm năng doanh thu",
  "Khả năng tiếp cận",
  "Chi phí thuê",
  "Cạnh tranh",
  "Rủi ro",
];

// Phân loại loại tiêu chí: 'good' = càng cao càng tốt, 'bad' = càng thấp càng tốt
const criteriaTypes = {
  "Tiềm năng doanh thu": "good",
  "Khả năng tiếp cận": "good",
  "Chi phí thuê": "bad",
  "Cạnh tranh": "bad",
  "Rủi ro": "bad",
};

const listEl = document.getElementById("criteriaList");

// Ma trận giá trị so sánh n x n (chỉ lưu nửa trên, chéo = 1)
// Khởi tạo tất cả bằng 1
const matrixValues = Array.from({ length: criteria.length }, () =>
  Array(criteria.length).fill(1)
);

function formatReciprocal(v) {
  return v === 1 ? "1" : `1/${v}`;
}

function renderCriteriaMatrix() {
  if (!listEl) return;
  const n = criteria.length;

  // Mô tả ngắn cho từng tiêu chí
  const criteriaDesc = [
    "Mức độ tiềm năng sinh lời của khu vực",
    "Mức độ thuận tiện di chuyển, giao thông",
    "Chi phí thuê mặt bằng hàng tháng",
    "Mật độ đối thủ cạnh tranh trong khu vực",
    "Mức độ rủi ro kinh doanh tại địa điểm",
  ];

  listEl.innerHTML = `
    <div class="ahp-hint">
      Chỉ nhập ô tam giác <strong>phía trên đường chéo</strong> với giá trị từ <strong>1 đến 9</strong>.
      Ô đối xứng sẽ tự động sinh nghịch đảo.
    </div>
    <div class="ahp-legend">
      ${criteria.map((c, i) => `
        <div class="ahp-legend-item">
          <span class="ahp-legend-code">C${i + 1}</span>
          <span class="ahp-legend-name">${c}</span>
          <span class="ahp-legend-desc">${criteriaDesc[i] || ""}</span>
        </div>
      `).join("")}
    </div>
    <div class="ahp-table-wrap">
      <table class="ahp-table">
        <thead>
          <tr>
            <th class="ahp-th-label">Tiêu chí</th>
            ${criteria.map((_, i) => `<th>C${i + 1}</th>`).join("")}
          </tr>
        </thead>
        <tbody id="ahpTbody">
        </tbody>
      </table>
    </div>
  `;

  const tbody = listEl.querySelector("#ahpTbody");

  for (let i = 0; i < n; i++) {
    const tr = document.createElement("tr");

    // Nhãn hàng
    const th = document.createElement("th");
    th.className = "ahp-row-label";
    th.textContent = `C${i + 1}`;
    tr.appendChild(th);

    for (let j = 0; j < n; j++) {
      const td = document.createElement("td");

      if (i === j) {
        // Đường chéo
        td.className = "ahp-cell ahp-diag";
        td.textContent = "1";
      } else if (j > i) {
        // Nửa trên: input
        td.className = "ahp-cell ahp-input-cell";
        const inp = document.createElement("input");
        inp.type = "number";
        inp.min = 1;
        inp.max = 9;
        inp.step = 1;
        inp.value = matrixValues[i][j];
        inp.className = "ahp-input";
        inp.addEventListener("input", () => {
          const raw = inp.value.trim();
          if (raw === "") return; // cho phép xóa trống, không ép về 1
          let v = parseInt(raw, 10);
          if (isNaN(v)) return;
          // Chỉ clamp khi giá trị rõ ràng vượt ngưỡng
          if (v > 9) { v = 9; inp.value = v; }
          if (v < 1) { v = 1; inp.value = v; }
          matrixValues[i][j] = v;
          matrixValues[j][i] = 1 / v;
          const mirror = tbody.rows[j].cells[i + 1];
          mirror.textContent = formatReciprocal(v);
        });
        inp.addEventListener("blur", () => {
          let v = parseInt(inp.value, 10);
          if (isNaN(v) || v < 1) v = 1;
          if (v > 9) v = 9;
          inp.value = v;
          matrixValues[i][j] = v;
          matrixValues[j][i] = 1 / v;
          const mirror = tbody.rows[j].cells[i + 1];
          mirror.textContent = formatReciprocal(v);
        });
        td.appendChild(inp);
      } else {
        // Nửa dưới: nghịch đảo
        td.className = "ahp-cell ahp-recip";
        const v = matrixValues[j][i]; // giá trị gốc ở nửa trên
        td.textContent = formatReciprocal(v);
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
}

renderCriteriaMatrix();

const calcBtn = document.getElementById("calcBtn");
const loginBtn = document.getElementById("loginBtn");
const googleBtn = document.getElementById("googleBtn");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("password");
const loginMsg = document.getElementById("loginMsg");
const openRegister = document.getElementById("openRegister");
const registerModal = document.getElementById("registerModal");
const registerBtn = document.getElementById("registerBtn");
const regEls = {
  fullname: document.getElementById("reg-fullname"),
  email: document.getElementById("reg-email"),
  phone: document.getElementById("reg-phone"),
  password: document.getElementById("reg-password"),
  passwordConfirm: document.getElementById("reg-password-confirm"),
  msg: document.getElementById("reg-msg"),
};

async function redirectIfLoggedIn() {
  try {
    const response = await fetch(
      API_BASE_URL + "/api/XacThucTaiKhoan/me",
      { method: "GET", credentials: "include" }
    );
    if (response.ok) {
      window.location.href = "dashboard.html";
    }
  } catch (_) {
    // ignore
  }
}

redirectIfLoggedIn();

// Hàm xây dựng ma trận tiêu chí từ bảng nhập liệu
function buildCriteriaMatrix() {
  const n = criteria.length;
  const round2 = (x) => Math.round(x * 100) / 100;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => {
      if (i === j) return 1;
      return round2(matrixValues[i][j]);
    })
  );
}

// Biến global để lưu TomSelect instances
let districtTomSelect = null;
let wardTomSelect = null;

// Chuẩn hoá chuỗi để gửi filter lên BE (bỏ dấu tiếng Việt, trim, gộp khoảng trắng)
function normalizeForFilter(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!s) return null;

  // Bỏ dấu: NFD tách dấu, rồi loại bỏ mark. Xử lý riêng Đ/đ.
  const noDiacritics = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  // Gộp nhiều khoảng trắng thành 1
  return noDiacritics.replace(/\s+/g, " ").trim();
}

// Hàm lấy giá trị text từ TomSelect instance hoặc select element
function getSelectText(selectElement, tomSelectInstance) {
  if (!selectElement || !selectElement.value) return null;

  // Nếu có TomSelect instance, dùng nó để lấy text
  if (tomSelectInstance) {
    const selectedValue = selectElement.value;
    const item = tomSelectInstance.getItem(selectedValue);
    if (item) {
      return item.text || item.textContent || selectedValue;
    }
  }

  // Fallback: tìm option có value đã chọn
  const selectedOption = Array.from(selectElement.options).find(
    opt => opt.value === selectElement.value
  );

  return selectedOption ? selectedOption.textContent.trim() : null;
}

// Hàm lấy filters từ các input
function getFilters() {
  const filters = {};

  // Lấy district (quận)
  const districtEl = document.getElementById("district");
  if (districtEl && districtEl.value) {
    const districtText = getSelectText(districtEl, districtTomSelect);
    if (districtText && districtText !== "Chọn Quận") {
      // Chuẩn hoá: "Quận 8" -> "Quan 8" (và bỏ dấu nói chung)
      const normalized = normalizeForFilter(districtText);
      if (normalized) filters.district = normalized;
    }
  }

  // Lấy ward (phường)
  const wardEl = document.getElementById("ward");
  if (wardEl && wardEl.value) {
    const wardText = getSelectText(wardEl, wardTomSelect);
    if (wardText && wardText !== "Chọn Phường / Xã") {
      const normalized = normalizeForFilter(wardText);
      if (normalized) filters.ward = normalized;
    }
  }

  // Lấy street (tên đường)
  const streetEl = document.getElementById("street");
  if (streetEl && streetEl.value) {
    const streetValue = streetEl.value.trim();
    if (streetValue) {
      // Street thường match dạng substring -> cũng chuẩn hoá để đồng bộ dữ liệu không dấu
      const normalized = normalizeForFilter(streetValue);
      if (normalized) filters.street = normalized;
    }
  }

  return filters;
}


// =====================================================
// AHP 4-BƯỚC API PIPELINE (index.html)
// =====================================================

let appPipelineWeights = null; // [W1..W5] sau bước 3

// Lấy/tạo container hiển thị kết quả pipeline
function getAppPipelineContainer() {
  let el = document.getElementById("appPipelineResult");
  if (!el) {
    el = document.createElement("div");
    el.id = "appPipelineResult";
    // Chèn sau card chứa bảng criteria
    const criteriaCard = listEl?.closest(".card") || listEl?.parentElement;
    if (criteriaCard) criteriaCard.after(el);
    else document.querySelector(".content")?.appendChild(el);
  }
  return el;
}

function showAppPipelineStep(html) {
  getAppPipelineContainer().innerHTML = html;
}

function appRenderColumnSumsRow(colSums) {
  const table = listEl?.querySelector(".ahp-table");
  if (!table) return;
  const old = table.querySelector("tfoot");
  if (old) old.remove();

  const tfoot = document.createElement("tfoot");
  const tr = document.createElement("tr");
  tr.style.cssText = "background:#eaf1ff; font-weight:700;";

  const th = document.createElement("th");
  th.textContent = "Σ Tổng";
  th.className = "ahp-row-label";
  th.style.color = "var(--text)";
  tr.appendChild(th);

  (colSums || []).forEach(s => {
    const td = document.createElement("td");
    td.className = "ahp-cell";
    td.textContent = Number(s).toFixed(4);
    td.style.color = "var(--primary)";
    tr.appendChild(td);
  });

  tfoot.appendChild(tr);
  table.appendChild(tfoot);
}

function appRenderNormalizedMatrix(normMatrix) {
  const rows = normMatrix.map((row, i) =>
    `<tr>
      <th class="ahp-row-label" style="background:#f0f4ff;">C${i + 1}</th>
      ${row.map(v => `<td class="ahp-cell" style="background:#fff;">${Number(v).toFixed(4)}</td>`).join("")}
    </tr>`
  ).join("");

  return `
    <div class="card" style="margin-top:12px;">
      <div class="section-title">📋 Ma trận chuẩn hóa</div>
      <div class="ahp-hint">Mỗi cột tổng bằng 1.0 sau chuẩn hóa.</div>
      <div class="ahp-table-wrap">
        <table class="ahp-table">
          <thead><tr>
            <th class="ahp-th-label">Tiêu chí</th>
            ${criteria.map((_, i) => `<th>C${i + 1}</th>`).join("")}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function appRenderWeightsResult(data) {
  const weights = data.weights || {};
  const cr = Number(data.consistency_ratio || 0);
  const isValid = data.is_valid;
  const weightList = Object.keys(weights).map(k => `
    <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0f4ff; font-size:12px;">
      <span style="color:var(--muted);">${k.replace(/_/g, " ")}</span>
      <span style="font-weight:700; color:var(--primary);">${(Number(weights[k]) * 100).toFixed(2)}%</span>
    </div>`).join("");

  const crColor = isValid ? "#15803d" : "#b91c1c";
  const crIcon = isValid ? "✅" : "⚠️";

  return `
    <div class="card" style="margin-top:12px;">
      <div class="section-title">⚖️ Trọng số tiêu chí (Priority Vector)</div>
      <div style="margin:8px 0;">${weightList}</div>
      <div style="margin-top:10px; padding:10px; border-radius:8px; background:${isValid ? "#f0fdf4" : "#fff1f2"}; border:1px solid ${isValid ? "#bbf7d0" : "#fecaca"};">
        <div style="font-size:12px; color:${crColor}; font-weight:700;">
          ${crIcon} CHỈ SỐ NHẤT QUÁN (CR): <strong>${cr.toFixed(4)}</strong>
        </div>
        <div style="font-size:11px; color:${crColor}; margin-top:4px;">${data.message || ""}</div>
      </div>
      ${isValid
      ? `<button class="btn" id="appStartAnalysisBtn" style="width:100%; margin-top:12px;">🚀 Phân tích địa điểm</button>`
      : `<div style="margin-top:10px; padding:10px; border-radius:8px; background:#fff1f2; border:1px solid #fecaca; font-size:12px; color:#b91c1c;">
             Vui lòng sửa lại bảng so sánh cặp và tính toán lại.
           </div>`
    }
    </div>`;
}

async function runAppAhpPipeline() {
  if (calcBtn) { calcBtn.disabled = true; calcBtn.textContent = "Đang xử lý..."; }
  appPipelineWeights = null;

  // Xóa hàng tổng cũ + kết quả cũ
  listEl?.querySelector(".ahp-table tfoot")?.remove();
  showAppPipelineStep(`<div style="padding:12px; font-size:12px; color:var(--muted); text-align:center;">⏳ Đang gọi API...</div>`);

  const rawMatrix = buildCriteriaMatrix();

  try {
    // Bước 1: column-sums (hiện tổng cột)
    const res1 = await apiFetch("/api/ahp/calculate/column-sums", {
      method: "POST",
      body: JSON.stringify({ criteriaMatrix: rawMatrix }),
    });
    appRenderColumnSumsRow(res1.column_sums || []);

    // Bước 2: normalize-matrix
    const res2 = await apiFetch("/api/ahp/calculate/normalize-matrix", {
      method: "POST",
      body: JSON.stringify({ criteriaMatrix: rawMatrix }),
    });

    // Bước 3: priority-vector-and-cr
    const res3 = await apiFetch("/api/ahp/calculate/priority-vector-and-cr", {
      method: "POST",
      body: JSON.stringify({
        raw_matrix: rawMatrix,
        normalized_matrix: res2.normalized_matrix,
      }),
    });

    showAppPipelineStep(
      appRenderNormalizedMatrix(res2.normalized_matrix) +
      appRenderWeightsResult(res3)
    );

    if (res3.is_valid) {
      appPipelineWeights = Object.values(res3.weights || {});
      setTimeout(() => {
        const startBtn = document.getElementById("appStartAnalysisBtn");
        if (startBtn) startBtn.addEventListener("click", runAppFinalAnalysis);
      }, 0);
    }
  } catch (err) {
    showAppPipelineStep(`<div class="card" style="margin-top:12px; padding:14px;">
      <div style="color:#b91c1c; font-weight:700;">❌ Lỗi khi tính toán</div>
      <div style="font-size:12px; color:var(--muted); margin-top:6px;">${err.message}</div>
    </div>`);
    console.error("AHP pipeline error:", err);
  } finally {
    if (calcBtn) { calcBtn.disabled = false; calcBtn.textContent = "Tính điểm tiêu chí"; }
  }
}

async function runAppFinalAnalysis() {
  const btn = document.getElementById("appStartAnalysisBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Đang phân tích..."; }

  try {
    const filters = getFilters();
    filters.limit = 50;

    const result = await apiFetch("/api/locations/execute-final-analysis", {
      method: "POST",
      body: JSON.stringify({ weights: appPipelineWeights, filters }),
    });

    localStorage.setItem("ahp:lastRequest", JSON.stringify({ weights: appPipelineWeights, filters }));
    localStorage.setItem("ahp:lastResponse", JSON.stringify(result));

    window.location.href = "map.html";
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = "🚀 Phân tích địa điểm"; }
    alert("❌ Lỗi khi phân tích: " + err.message);
    console.error("Final analysis error:", err);
  }
}

if (calcBtn) {
  calcBtn.addEventListener("click", runAppAhpPipeline);
}



if (loginBtn && emailInput && passwordInput && loginMsg) {
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      loginMsg.textContent = "Vui lòng nhập email và mật khẩu.";
      loginMsg.style.color = "#b45309";
      return;
    }

    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Đang đăng nhập...";

      const response = await fetch(
        API_BASE_URL + "/api/XacThucTaiKhoan/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        loginMsg.textContent = data.detail || "Đăng nhập thất bại.";
        loginMsg.style.color = "#b91c1c";
        return;
      }

      loginMsg.textContent = "Đăng nhập thành công.";
      loginMsg.style.color = "#15803d";
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Login error:", error);
      loginMsg.textContent = "Lỗi kết nối tới backend.";
      loginMsg.style.color = "#b91c1c";
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Đăng nhập";
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener("click", () => {
    const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    const CLIENT_ID =
      "596598398379-in2t43evk7clm9pffdjrvm8jg5mit72d.apps.googleusercontent.com";
    const REDIRECT_URI = "http://127.0.0.1:5500/google-callback.html";
    const SCOPE = "email profile";

    const url =
      `${GOOGLE_AUTH_URL}?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      "&response_type=code" +
      `&scope=${encodeURIComponent(SCOPE)}`;

    window.location.href = url;
  });
}

if (openRegister && registerModal) {
  openRegister.addEventListener("click", () => {
    registerModal.classList.add("active");
  });
}

if (registerModal) {
  registerModal.addEventListener("click", (e) => {
    if (e.target.id === "registerModal") {
      e.target.classList.remove("active");
    }
  });
}

async function handleRegister() {
  if (!registerBtn) return;
  if (regEls.msg) {
    regEls.msg.textContent = "";
  }

  const fullname = regEls.fullname ? regEls.fullname.value.trim() : "";
  const email = regEls.email ? regEls.email.value.trim() : "";
  const sodienthoai = regEls.phone ? regEls.phone.value.trim() : "";
  const password = regEls.password ? regEls.password.value : "";
  const passwordConfirm = regEls.passwordConfirm
    ? regEls.passwordConfirm.value
    : "";

  if (!fullname || !email || !password) {
    if (regEls.msg) {
      regEls.msg.textContent = "Vui lòng nhập đầy đủ họ tên, email, mật khẩu.";
      regEls.msg.style.color = "#b91c1c";
    }
    return;
  }

  if (password !== passwordConfirm) {
    if (regEls.msg) {
      regEls.msg.textContent = "Mật khẩu xác nhận không khớp.";
      regEls.msg.style.color = "#b91c1c";
    }
    return;
  }

  const payload = {
    fullname,
    email,
    password,
    ...(sodienthoai ? { phone: sodienthoai } : {}),
  };

  try {
    registerBtn.disabled = true;
    registerBtn.textContent = "Đang đăng ký...";

    const response = await fetch(
      API_BASE_URL + "/api/XacThucTaiKhoan/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data.detail || "Đăng ký thất bại.";
      if (regEls.msg) {
        regEls.msg.textContent = msg;
        regEls.msg.style.color = "#b91c1c";
      }
      return;
    }

    if (regEls.msg) {
      regEls.msg.textContent = "Đăng ký thành công. Đang chuyển hướng...";
      regEls.msg.style.color = "#15803d";
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Register error:", err);
    if (regEls.msg) {
      regEls.msg.textContent = "Lỗi kết nối tới backend.";
      regEls.msg.style.color = "#b91c1c";
    }
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Đăng ký";
  }
}

if (registerBtn) {
  registerBtn.addEventListener("click", handleRegister);
}

// api.js phải được load trước app.js để apiFetch khả dụng


const businessTypeEl = document.getElementById("businessType");
if (businessTypeEl) {
  new TomSelect(businessTypeEl, {
    create: true,
    sortField: {
      field: "text",
      direction: "asc",
    },
    placeholder: "Chọn hoặc nhập loại kinh doanh",
  });
}

async function initLocationSelects() {
  const cityEl = document.getElementById("district");
  const wardEl = document.getElementById("ward");
  if (!cityEl || !wardEl) return;

  try {
    // Load quận & phường từ file JSON
    const [quanRes, phuongRes] = await Promise.all([
      fetch("js/data/Quan.json"),
      fetch("js/data/Phuong.json"),
    ]);

    const [quanAll, phuongAll] = await Promise.all([
      quanRes.json(),
      phuongRes.json(),
    ]);

    // Lọc quận thuộc TP.HCM (idTinh = "1")
    const quanHCM = Array.isArray(quanAll)
      ? quanAll.filter((q) => q.idTinh === "1")
      : [];

    // Reset options quận
    cityEl.innerHTML = "";
    const defaultCityOpt = document.createElement("option");
    defaultCityOpt.value = "";
    defaultCityOpt.textContent = "Chọn Quận";
    defaultCityOpt.disabled = true;
    defaultCityOpt.selected = true;
    cityEl.appendChild(defaultCityOpt);

    quanHCM.forEach((q) => {
      const opt = document.createElement("option");
      opt.value = q.id; // lưu id quận
      opt.textContent = q.ten;
      cityEl.appendChild(opt);
    });

    // Reset options phường
    wardEl.innerHTML = "";
    const defaultWardOpt = document.createElement("option");
    defaultWardOpt.value = "";
    defaultWardOpt.textContent = "Chọn Phường / Xã";
    defaultWardOpt.disabled = true;
    defaultWardOpt.selected = true;
    wardEl.appendChild(defaultWardOpt);

    // Khởi tạo TomSelect cho quận & phường
    districtTomSelect = new TomSelect(cityEl, {
      create: false,
      placeholder: "Chọn Quận",
    });

    wardTomSelect = new TomSelect(wardEl, {
      create: false,
      placeholder: "Chọn Phường / Xã",
    });

    function updateWardsForDistrict(districtId) {
      // Lọc phường theo idQuan (id quận)
      const wards = Array.isArray(phuongAll)
        ? phuongAll.filter((p) => p.idQuan === districtId)
        : [];

      wardTomSelect.clear(); // clear selected value
      wardTomSelect.clearOptions();

      wards.forEach((w) => {
        wardTomSelect.addOption({ value: w.id, text: w.ten });
      });

      wardTomSelect.refreshOptions(false);
    }

    // Khi chọn quận thì load danh sách phường tương ứng
    districtTomSelect.on("change", (value) => {
      if (!value) return;
      updateWardsForDistrict(value);
    });
  } catch (err) {
    console.error("Lỗi khi khởi tạo select quận/phường:", err);
  }
}

initLocationSelects();
