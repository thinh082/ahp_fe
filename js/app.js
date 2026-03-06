
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
// AHP PIPELINE - GIAO DIỆN 3 BƯỚC TUẦN TỰ (index.html)
// =====================================================

// Biến lưu trạng thái pipeline
let appPipelineWeights = null;   // Trọng số từ Bước 2
let _pipelineRawMatrix = null;   // Ma trận gốc (dùng qua các bước)
let _pipelineRes2 = null;        // Kết quả normalize-matrix (dùng ở Bước 2)
let _currentStep = 0;            // Bước hiện tại: 0 = chưa bắt đầu, 1/2/3 = Step 1/2/3

// ── Hàm tiện ích ────────────────────────────────────────────

// Xây dựng hàng tổng cột dưới bảng ma trận
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

// Render bảng ma trận chuẩn hóa
function appRenderNormalizedMatrix(normMatrix) {
  const rows = normMatrix.map((row, i) =>
    `<tr>
      <th class="ahp-row-label" style="background:#f0f4ff;">C${i + 1}</th>
      ${row.map(v => `<td class="ahp-cell" style="background:#fff;">${Number(v).toFixed(4)}</td>`).join("")}
    </tr>`
  ).join("");

  return `
    <div class="ahp-table-wrap" style="margin-top:10px;">
      <table class="ahp-table">
        <thead><tr>
          <th class="ahp-th-label">Tiêu chí</th>
          ${criteria.map((_, i) => `<th>C${i + 1}</th>`).join("")}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── STEPPER UI ───────────────────────────────────────────────

// Lấy/tạo container chứa toàn bộ stepper (nếu chưa có trong HTML)
function getStepperContainer() {
  let el = document.getElementById("ahpStepperContainer");
  if (!el) {
    el = document.createElement("div");
    el.id = "ahpStepperContainer";
    // Chèn sau card chứa bảng criteria
    const criteriaCard = listEl?.closest(".card") || listEl?.parentElement?.closest(".glass-card") || listEl?.parentElement;
    if (criteriaCard) criteriaCard.after(el);
    else document.querySelector(".left-column")?.appendChild(el);
  }
  return el;
}

// Khởi tạo HTML của stepper (3 step divs + thanh tiến trình)
function initStepperHTML() {
  const container = getStepperContainer();
  container.innerHTML = `
    <!-- ── Thanh tiến trình 3 bước ── -->
    <div class="ahp-stepper-track">
      <div class="ahp-stepper-step active" id="stepTrack1">
        <div class="ahp-stepper-circle">1</div>
        <div class="ahp-stepper-label">Ma trận &amp; Trọng số</div>
      </div>
      <div class="ahp-stepper-connector"></div>
      <div class="ahp-stepper-step" id="stepTrack2">
        <div class="ahp-stepper-circle">2</div>
        <div class="ahp-stepper-label">Kiểm tra CR</div>
      </div>
      <div class="ahp-stepper-connector"></div>
      <div class="ahp-stepper-step" id="stepTrack3">
        <div class="ahp-stepper-circle">3</div>
        <div class="ahp-stepper-label">Hiển thị bản đồ</div>
      </div>
    </div>

    <!-- ── Viewport trượt chứa 3 step ── -->
    <div class="ahp-stepper-viewport">
      <div class="ahp-stepper-slides" id="ahpStepperSlides">

        <!-- Step 1: Tính toán ma trận và trọng số -->
        <div class="ahp-step-panel" id="ahpStep1">
          <div class="ahp-step-header">
            <div class="ahp-step-badge">Bước 1</div>
            <div class="ahp-step-title">📊 Tính toán Ma trận &amp; Trọng số</div>
            <div class="ahp-step-desc">Hệ thống tính tổng cột, chuẩn hóa ma trận và tính vector trọng số ưu tiên.</div>
          </div>
          <div class="ahp-step-body" id="step1Body">
            <div class="ahp-step-placeholder">
              Nhấn <strong>Bắt đầu Bước 1</strong> để tính toán.
            </div>
          </div>
          <div class="ahp-step-footer">
            <div></div>
            <button class="ahp-btn-next" id="step1Btn" onclick="runStep1()">
              Bắt đầu Bước 1 →
            </button>
          </div>
        </div>

        <!-- Step 2: Kiểm tra Consistency Ratio -->
        <div class="ahp-step-panel" id="ahpStep2">
          <div class="ahp-step-header">
            <div class="ahp-step-badge">Bước 2</div>
            <div class="ahp-step-title">✅ Kiểm tra Tính nhất quán (CR)</div>
            <div class="ahp-step-desc">Kiểm tra Consistency Ratio. CR &lt; 0.1 thì ma trận hợp lệ để tiếp tục.</div>
          </div>
          <div class="ahp-step-body" id="step2Body">
            <div class="ahp-step-placeholder">
              Nhấn <strong>Tính CR</strong> để kiểm tra tính nhất quán.
            </div>
          </div>
          <div class="ahp-step-footer">
            <button class="ahp-btn-back" onclick="goToStep(1)">← Quay lại</button>
            <button class="ahp-btn-next" id="step2Btn" onclick="runStep2()">
              Tính CR →
            </button>
          </div>
        </div>

        <!-- Step 3: Hiển thị bản đồ kết quả -->
        <div class="ahp-step-panel" id="ahpStep3">
          <div class="ahp-step-header">
            <div class="ahp-step-badge">Bước 3</div>
            <div class="ahp-step-title">🗺️ Hiển thị bản đồ kết quả</div>
            <div class="ahp-step-desc">Phân tích tất cả địa điểm theo trọng số AHP và hiển thị lên bản đồ.</div>
          </div>
          <div class="ahp-step-body" id="step3Body">
            <div class="ahp-step-placeholder">
              Nhấn <strong>Phân tích &amp; Xem bản đồ</strong> để bắt đầu.
            </div>
          </div>
          <div class="ahp-step-footer">
            <button class="ahp-btn-back" id="step3BackBtn" onclick="goToStep(2)">← Quay lại</button>
            <button class="ahp-btn-next" id="step3Btn" onclick="runStep3()">
              🚀 Phân tích &amp; Xem bản đồ
            </button>
          </div>
        </div>

      </div><!-- /.ahp-stepper-slides -->
    </div><!-- /.ahp-stepper-viewport -->
  `;
}

// Chuyển sang bước `stepNum` (1, 2, hoặc 3) với animation slide
function goToStep(stepNum) {
  _currentStep = stepNum;

  // Trượt slides sang đúng vị trí (0 = bước 1, 1 = bước 2, 2 = bước 3)
  const slides = document.getElementById("ahpStepperSlides");
  if (slides) {
    slides.style.transform = `translateX(-${(stepNum - 1) * 100}%)`;
  }

  // Cập nhật trạng thái track indicator
  [1, 2, 3].forEach(n => {
    const track = document.getElementById(`stepTrack${n}`);
    if (!track) return;
    track.classList.remove("active", "done");
    if (n < stepNum) track.classList.add("done");
    else if (n === stepNum) track.classList.add("active");
  });
}

// ── API CALLS cho từng bước ──────────────────────────────────

/**
 * Bước 1: Gọi API tính tổng cột + chuẩn hóa ma trận.
 * Hiển thị kết quả trong Step 1 và cho phép chuyển sang Step 2.
 */
async function runStep1() {
  const btn = document.getElementById("step1Btn");
  const body = document.getElementById("step1Body");
  if (!btn || !body) return;

  // Disable nút và hiện trạng thái loading
  btn.disabled = true;
  btn.textContent = "⏳ Đang tính toán...";
  body.innerHTML = `<div class="ahp-loading">⏳ Đang gọi API tính toán...</div>`;

  // Xóa hàng tổng cũ trong bảng input (nếu có)
  listEl?.querySelector(".ahp-table tfoot")?.remove();
  _pipelineRawMatrix = buildCriteriaMatrix();

  try {
    // Gọi endpoint tính tổng cột
    const res1 = await apiFetch("/api/ahp/calculate/column-sums", {
      method: "POST",
      body: JSON.stringify({ criteriaMatrix: _pipelineRawMatrix }),
    });
    // Hiển thị tổng cột trong bảng ma trận phía trên
    appRenderColumnSumsRow(res1.column_sums || []);

    // Gọi endpoint chuẩn hóa ma trận
    const res2 = await apiFetch("/api/ahp/calculate/normalize-matrix", {
      method: "POST",
      body: JSON.stringify({ criteriaMatrix: _pipelineRawMatrix }),
    });
    // Lưu kết quả để dùng ở Bước 2
    _pipelineRes2 = res2;

    // Hiển thị kết quả bước 1 trong panel
    body.innerHTML = `
      <div class="ahp-result-box ahp-result-success">
        <div class="ahp-result-title">✅ Hoàn thành Bước 1</div>
        <div class="ahp-result-desc">Đã tính tổng cột (hiển thị trong bảng trên) và chuẩn hóa ma trận thành công.</div>
      </div>
      <div class="ahp-step-section-title">📋 Ma trận chuẩn hóa</div>
      ${appRenderNormalizedMatrix(res2.normalized_matrix || [])}
      <div style="margin-top:10px; font-size:11px; color:#64748b;">Mỗi cột tổng ≈ 1.0 sau chuẩn hóa.</div>
    `;

    // Cập nhật nút → chuyển sang bước 2
    btn.disabled = false;
    btn.textContent = "Tiếp theo: Kiểm tra CR →";
    btn.onclick = () => goToStep(2);

  } catch (err) {
    body.innerHTML = `<div class="ahp-result-box ahp-result-error">
      <div class="ahp-result-title">❌ Lỗi Bước 1</div>
      <div class="ahp-result-desc">${err.message}</div>
    </div>`;
    btn.disabled = false;
    btn.textContent = "Thử lại →";
    btn.onclick = runStep1;
    console.error("Step 1 error:", err);
  }
}

/**
 * Bước 2: Gọi API tính priority vector và Consistency Ratio (CR).
 * Dùng kết quả từ Bước 1 (_pipelineRawMatrix, _pipelineRes2).
 */
async function runStep2() {
  const btn = document.getElementById("step2Btn");
  const body = document.getElementById("step2Body");
  if (!btn || !body) return;

  // Kiểm tra dữ liệu từ bước 1 có sẵn không
  if (!_pipelineRawMatrix || !_pipelineRes2) {
    body.innerHTML = `<div class="ahp-result-box ahp-result-warning">
      ⚠️ Hãy hoàn thành Bước 1 trước khi tiếp tục.
    </div>`;
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ Đang tính CR...";
  body.innerHTML = `<div class="ahp-loading">⏳ Đang kiểm tra tính nhất quán...</div>`;

  try {
    // Gọi endpoint tính priority vector + CR, dựa trên kết quả bước 1
    const res3 = await apiFetch("/api/ahp/calculate/priority-vector-and-cr", {
      method: "POST",
      body: JSON.stringify({
        raw_matrix: _pipelineRawMatrix,
        normalized_matrix: _pipelineRes2.normalized_matrix,
      }),
    });

    const weights = res3.weights || {};
    const cr = Number(res3.consistency_ratio || 0);
    const isValid = res3.is_valid;

    // Lưu trọng số để dùng ở Bước 3
    if (isValid) {
      appPipelineWeights = Object.values(weights);
    } else {
      appPipelineWeights = null;
    }

    // Render danh sách trọng số
    const weightListHTML = Object.keys(weights).map(k => `
      <div class="ahp-weight-row">
        <span class="ahp-weight-key">${k.replace(/_/g, " ")}</span>
        <span class="ahp-weight-val">${(Number(weights[k]) * 100).toFixed(2)}%</span>
      </div>`).join("");

    // Hiển thị kết quả CR và trọng số
    body.innerHTML = `
      <div class="ahp-result-box ${isValid ? "ahp-result-success" : "ahp-result-error"}">
        <div class="ahp-result-title">
          ${isValid ? "✅ Ma trận hợp lệ (CR &lt; 0.1)" : "⚠️ Ma trận chưa nhất quán (CR ≥ 0.1)"}
        </div>
        <div class="ahp-cr-badge" style="background:${isValid ? "#dcfce7" : "#fef2f2"}; color:${isValid ? "#15803d" : "#b91c1c"};">
          CR = <strong>${cr.toFixed(4)}</strong>
        </div>
        <div class="ahp-result-desc">${res3.message || ""}</div>
      </div>
      <div class="ahp-step-section-title">⚖️ Trọng số tiêu chí</div>
      <div class="ahp-weight-list">${weightListHTML}</div>
      ${!isValid ? `<div class="ahp-result-box ahp-result-warning" style="margin-top:10px;">
        💡 Vui lòng quay lại <strong>Bước 1</strong> và điều chỉnh lại bảng so sánh cặp để CR &lt; 0.1.
      </div>` : ""}
    `;

    btn.disabled = false;
    if (isValid) {
      btn.textContent = "Tiếp theo: Xem bản đồ →";
      btn.onclick = () => goToStep(3);
    } else {
      // CR không hợp lệ → không cho next, chỉ cho quay lại
      btn.textContent = "Tính lại CR";
      btn.onclick = runStep2;
    }

  } catch (err) {
    body.innerHTML = `<div class="ahp-result-box ahp-result-error">
      <div class="ahp-result-title">❌ Lỗi Bước 2</div>
      <div class="ahp-result-desc">${err.message}</div>
    </div>`;
    btn.disabled = false;
    btn.textContent = "Thử lại →";
    btn.onclick = runStep2;
    console.error("Step 2 error:", err);
  }
}

/**
 * Bước 3: Gọi API phân tích địa điểm cuối cùng với trọng số từ Bước 2.
 * Sau khi nhận kết quả, lưu vào localStorage và chuyển sang map.html.
 */
async function runStep3() {
  const btn = document.getElementById("step3Btn");
  const backBtn = document.getElementById("step3BackBtn");
  const body = document.getElementById("step3Body");
  if (!btn || !body) return;

  // Kiểm tra trọng số hợp lệ từ bước 2
  if (!appPipelineWeights || appPipelineWeights.length === 0) {
    body.innerHTML = `<div class="ahp-result-box ahp-result-warning">
      ⚠️ Cần hoàn thành Bước 2 (CR hợp lệ) trước khi phân tích địa điểm.
    </div>`;
    return;
  }

  btn.disabled = true;
  if (backBtn) backBtn.disabled = true;
  btn.textContent = "⏳ Đang phân tích...";
  body.innerHTML = `<div class="ahp-loading">🗺️ Đang phân tích địa điểm và chuẩn bị bản đồ...</div>`;

  try {
    const filters = getFilters();
    filters.limit = 50;

    // Gọi endpoint phân tích địa điểm với trọng số AHP
    const result = await apiFetch("/api/locations/execute-final-analysis", {
      method: "POST",
      body: JSON.stringify({ weights: appPipelineWeights, filters }),
    });

    // Lưu kết quả vào localStorage để map.html đọc
    localStorage.setItem("ahp:lastRequest", JSON.stringify({ weights: appPipelineWeights, filters }));
    localStorage.setItem("ahp:lastResponse", JSON.stringify(result));

    body.innerHTML = `<div class="ahp-result-box ahp-result-success">
      <div class="ahp-result-title">✅ Phân tích hoàn tất!</div>
      <div class="ahp-result-desc">Đang chuyển đến bản đồ kết quả...</div>
    </div>`;

    // Chuyển sang trang bản đồ
    window.location.href = "map.html";

  } catch (err) {
    body.innerHTML = `<div class="ahp-result-box ahp-result-error">
      <div class="ahp-result-title">❌ Lỗi Bước 3</div>
      <div class="ahp-result-desc">${err.message}</div>
    </div>`;
    btn.disabled = false;
    if (backBtn) backBtn.disabled = false;
    btn.textContent = "🚀 Phân tích & Xem bản đồ";
    btn.onclick = runStep3;
    console.error("Step 3 error:", err);
  }
}

// Khởi tạo stepper khi bấm nút "Tính điểm tiêu chí"
if (calcBtn) {
  calcBtn.addEventListener("click", () => {
    // Khởi tạo giao diện stepper (reset hoàn toàn)
    initStepperHTML();
    // Chuyển đến bước 1
    goToStep(1);
    // Reset trạng thái pipeline
    appPipelineWeights = null;
    _pipelineRawMatrix = null;
    _pipelineRes2 = null;
    // Xóa hàng tổng cũ trong bảng
    listEl?.querySelector(".ahp-table tfoot")?.remove();
  });
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
