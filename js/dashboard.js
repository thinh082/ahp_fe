// Dữ liệu tiêu chí - theo sơ đồ AHP
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

// Ma trận giá trị so sánh tiêu chí n x n (khởi tạo tất cả = 1)
const criteriaMatrixValues = Array.from({ length: criteria.length }, () =>
  Array(criteria.length).fill(1)
);

// Danh sách phương án địa điểm
let alternatives = [];

// Các cặp so sánh tiêu chí (giữ lại để tương thích với buildComparisonMatrix)
const criteriaPairs = [];
const criteriaListEl = document.getElementById("criteriaList");

// Dữ liệu so sánh phương án: { criterionIndex: { pairs: [], matrix: [] } }
const alternativesComparison = {};

// Khởi tạo các cặp tiêu chí
for (let i = 0; i < criteria.length; i++) {
  for (let j = i + 1; j < criteria.length; j++) {
    criteriaPairs.push({ a: i, b: j, value: 1 });
  }
}

// Khởi tạo so sánh phương án cho từng tiêu chí
function initAlternativesComparison() {
  for (let c = 0; c < criteria.length; c++) {
    const pairs = [];
    for (let i = 0; i < alternatives.length; i++) {
      for (let j = i + 1; j < alternatives.length; j++) {
        pairs.push({ a: i, b: j, value: 1 });
      }
    }
    alternativesComparison[c] = { pairs, matrix: null };
  }
}

function formatReciprocal(v) {
  return v === 1 ? "1" : `1/${v}`;
}

// Hiển thị bảng ma trận AHP tiêu chí
function renderCriteriaPairs() {
  if (!criteriaListEl) return;
  const n = criteria.length;

  const criteriaDesc = [
    "Mức độ tiềm năng sinh lời của khu vực",
    "Mức độ thuận tiện di chuyển, giao thông",
    "Chi phí thuê mặt bằng hàng tháng",
    "Mật độ đối thủ cạnh tranh trong khu vực",
    "Mức độ rủi ro kinh doanh tại địa điểm",
  ];

  criteriaListEl.innerHTML = `
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
        <tbody id="ahpCriteriaTbody"></tbody>
      </table>
    </div>
  `;

  const tbody = criteriaListEl.querySelector("#ahpCriteriaTbody");

  for (let i = 0; i < n; i++) {
    const tr = document.createElement("tr");

    const th = document.createElement("th");
    th.className = "ahp-row-label";
    th.textContent = `C${i + 1}`;
    tr.appendChild(th);

    for (let j = 0; j < n; j++) {
      const td = document.createElement("td");

      if (i === j) {
        td.className = "ahp-cell ahp-diag";
        td.textContent = "1";
      } else if (j > i) {
        td.className = "ahp-cell ahp-input-cell";
        const inp = document.createElement("input");
        inp.type = "number";
        inp.min = 1;
        inp.max = 9;
        inp.step = 1;
        inp.value = criteriaMatrixValues[i][j];
        inp.className = "ahp-input";
        inp.addEventListener("input", () => {
          const raw = inp.value.trim();
          if (raw === "") return; // cho phép xóa trống, không ép về 1
          let v = parseInt(raw, 10);
          if (isNaN(v)) return;
          if (v > 9) { v = 9; inp.value = v; }
          if (v < 1) { v = 1; inp.value = v; }
          criteriaMatrixValues[i][j] = v;
          criteriaMatrixValues[j][i] = 1 / v;
          const mirror = tbody.rows[j].cells[i + 1];
          mirror.textContent = formatReciprocal(v);
          const pairIdx = criteriaPairs.findIndex(p => p.a === i && p.b === j);
          if (pairIdx !== -1) criteriaPairs[pairIdx].value = v;
        });
        inp.addEventListener("blur", () => {
          let v = parseInt(inp.value, 10);
          if (isNaN(v) || v < 1) v = 1;
          if (v > 9) v = 9;
          inp.value = v;
          criteriaMatrixValues[i][j] = v;
          criteriaMatrixValues[j][i] = 1 / v;
          const mirror = tbody.rows[j].cells[i + 1];
          mirror.textContent = formatReciprocal(v);
          const pairIdx = criteriaPairs.findIndex(p => p.a === i && p.b === j);
          if (pairIdx !== -1) criteriaPairs[pairIdx].value = v;
        });
        td.appendChild(inp);
      } else {
        td.className = "ahp-cell ahp-recip";
        const v = criteriaMatrixValues[j][i];
        td.textContent = formatReciprocal(v);
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
}

// Hiển thị danh sách phương án
function renderAlternatives() {
  const listEl = document.getElementById("alternativesList");
  listEl.innerHTML = "";
  alternatives.forEach((alt, idx) => {
    const item = document.createElement("div");
    item.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; background: #f9fafb;";
    item.innerHTML = `
          <span style="font-size: 13px;">${alt}</span>
          <button class="btn" style="padding: 6px 12px; font-size: 11px;" data-idx="${idx}">Xóa</button>
        `;
    item.querySelector("button").addEventListener("click", () => {
      alternatives.splice(idx, 1);
      initAlternativesComparison();
      renderAlternatives();
      updateAlternativesComparison();
    });
    listEl.appendChild(item);
  });

  // Cập nhật dropdown so sánh
  const select = document.getElementById("selectedCriterion");
  select.innerHTML = '<option value="">Chọn tiêu chí...</option>';
  criteria.forEach((c, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

// Hiển thị so sánh phương án
function renderAlternativesComparison(criterionIndex) {
  if (
    criterionIndex === null ||
    criterionIndex === undefined ||
    criterionIndex === ""
  )
    return;

  const comp = alternativesComparison[criterionIndex];
  if (!comp) return;

  const listEl = document.getElementById("alternativesComparisonList");
  listEl.innerHTML = "";

  // Lấy loại tiêu chí để đổi màu
  const criterionName = criteria[criterionIndex];
  const criterionType = criteriaTypes[criterionName];

  comp.pairs.forEach((pair, idx) => {
    const row = document.createElement("div");
    row.className = "c-row";

    const left = document.createElement("div");
    left.className = "c-left";
    left.textContent = alternatives[pair.a];

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "1";
    slider.max = "9";
    slider.step = "1";
    slider.value = String(pair.value);

    // Thiết lập thuộc tính visual feedback
    slider.setAttribute("data-criteria-type", criterionType);
    slider.setAttribute("data-value", slider.value);

    const score = document.createElement("div");
    score.className = "c-score";
    score.textContent = slider.value;

    const right = document.createElement("div");
    right.className = "c-right";
    right.textContent = alternatives[pair.b];

    slider.addEventListener("input", () => {
      score.textContent = slider.value;
      comp.pairs[idx].value = Number(slider.value);
      slider.setAttribute("data-value", slider.value);
    });

    row.append(left, slider, score, right);
    listEl.appendChild(row);
  });

  const card = document.getElementById("alternativesComparisonCard");
  if (alternatives.length >= 2) {
    card.style.display = "block";
  } else {
    card.style.display = "none";
  }
}

function updateAlternativesComparison() {
  const selected = document.getElementById("selectedCriterion").value;
  if (selected !== "") {
    renderAlternativesComparison(parseInt(selected));
  }
}

renderCriteriaPairs();
renderAlternatives();

// Thêm phương án từ dropdown
// Thêm phương án từ dropdown
function addAlternativeFromInputs() {
  const districtEl = document.getElementById("district");
  const wardEl = document.getElementById("ward");
  const street = document.getElementById("street").value.trim();

  const cityText = getSelectText(districtEl, districtTomSelect);
  const wardText = getSelectText(wardEl, wardTomSelect);

  if (!cityText || !wardText || !street) {
    alert("Vui lòng chọn đầy đủ Quận, Phường/Xã và nhập Tên đường!");
    return;
  }

  const selectedValue = `${street}, ${wardText}, ${cityText}`;

  if (alternatives.includes(selectedValue)) {
    alert("Phương án này đã được thêm vào danh sách!");
    return;
  }

  alternatives.push(selectedValue);
  initAlternativesComparison();
  renderAlternatives();
  updateAlternativesComparison();

  // Clear inputs
  document.getElementById("street").value = "";
}

// Khởi tạo các event listeners
const addAlternativeBtn = document.getElementById("addAlternativeBtn");
if (addAlternativeBtn) {
  addAlternativeBtn.addEventListener("click", addAlternativeFromInputs);
}

// Biến global để lưu TomSelect instances
let districtTomSelect = null;
let wardTomSelect = null;

function getSelectText(selectElement, tomSelectInstance) {
  if (!selectElement || !selectElement.value) return null;

  if (tomSelectInstance) {
    const selectedValue = selectElement.value;
    const item = tomSelectInstance.getItem(selectedValue);
    if (item) {
      return item.text || item.textContent || selectedValue;
    }
  }

  const selectedOption = Array.from(selectElement.options).find(
    (opt) => opt.value === selectElement.value
  );
  return selectedOption ? selectedOption.textContent.trim() : null;
}


// Chọn tiêu chí để so sánh phương án
const selectedCriterion = document.getElementById("selectedCriterion");
if (selectedCriterion) {
  selectedCriterion.addEventListener("change", updateAlternativesComparison);
}

// Xây dựng ma trận so sánh từ các cặp slider (gửi cho BE)
function buildComparisonMatrix(pairs, n) {
  const matrix = Array(n)
    .fill(0)
    .map(() => Array(n).fill(1));

  // Xây dựng ma trận từ các cặp
  pairs.forEach((pair) => {
    const i = pair.a;
    const j = pair.b;
    const value = pair.value;
    matrix[i][j] = value;
    matrix[j][i] = 1 / value;
  });

  return matrix;
}

// =====================================================
// AHP 4-BƯỚC API PIPELINE
// =====================================================

// State pipeline
let ahpPipelineWeights = null; // [W1..W5] sau khi bước 3 thành công
let ahpPipelineValid = false;  // true nếu CR < 0.1

// Xây dựng ma trận từ bảng nhập (criteriaMatrixValues)
function getRawMatrix() {
  const n = criteria.length;
  const r2 = (x) => Math.round(x * 100) / 100;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => (i === j ? 1 : r2(criteriaMatrixValues[i][j])))
  );
}

// Hiển thị kết quả pipeline bên dưới bảng ma trận
function getPipelineContainer() {
  let el = document.getElementById("ahpPipelineResult");
  if (!el) {
    el = document.createElement("div");
    el.id = "ahpPipelineResult";
    // Chèn sau card chứa criteriaList
    const criteriaCard = criteriaListEl?.closest(".card");
    if (criteriaCard) criteriaCard.after(el);
    else document.querySelector(".left")?.appendChild(el);
  }
  return el;
}

function showPipelineStep(html) {
  const container = getPipelineContainer();
  container.innerHTML = html;
}

function renderColumnSumsRow(colSums) {
  // Cập nhật hàng "Tổng cột" trong bảng AHP nếu có
  const tbody = criteriaListEl?.querySelector("#ahpCriteriaTbody");
  if (!tbody) return;
  // Xóa hàng cũ nếu có
  const old = criteriaListEl.querySelector("#ahpColSumRow");
  if (old) old.remove();

  const tfoot = document.createElement("tfoot");
  tfoot.id = "ahpColSumRow";
  const tr = document.createElement("tr");
  tr.style.cssText = "background:#eaf1ff; font-weight:700;";

  const th = document.createElement("th");
  th.textContent = "Σ Tổng";
  th.className = "ahp-row-label";
  th.style.color = "var(--text)";
  tr.appendChild(th);

  colSums.forEach(s => {
    const td = document.createElement("td");
    td.className = "ahp-cell";
    td.textContent = Number(s).toFixed(4);
    td.style.color = "var(--primary)";
    tr.appendChild(td);
  });

  tfoot.appendChild(tr);
  criteriaListEl.querySelector(".ahp-table")?.appendChild(tfoot);
}

function renderNormalizedMatrix(normMatrix) {
  const n = criteria.length;
  const rows = normMatrix.map((row, i) =>
    `<tr>
      <th class="ahp-row-label" style="background:#f0f4ff;">C${i + 1}</th>
      ${row.map(v => `<td class="ahp-cell" style="background:#fff;">${Number(v).toFixed(4)}</td>`).join("")}
    </tr>`
  ).join("");

  return `
    <div class="card" style="margin-top:12px;">
      <div class="section-title">📋 Ma trận chuẩn hóa</div>
      <div class="ahp-hint">Mỗi cột tổng đồng bằng 1.0 sau chuẩn hóa.</div>
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

function renderWeightsResult(data) {
  const weights = data.weights || {};
  const cr = Number(data.consistency_ratio || 0);
  const isValid = data.is_valid;
  const weightKeys = Object.keys(weights);
  const weightList = weightKeys.map(k => `
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
          ${crIcon} CHỄ SỐ NHẤT QUÁN (CR): <strong>${cr.toFixed(4)}</strong>
        </div>
        <div style="font-size:11px; color:${crColor}; margin-top:4px;">${data.message || ""}</div>
      </div>
      ${isValid
      ? `<button class="btn" id="startAnalysisBtn" style="width:100%; margin-top:12px;">🚀 Phân tích địa điểm</button>`
      : `<div style="margin-top:10px; padding:10px; border-radius:8px; background:#fff1f2; border:1px solid #fecaca; font-size:12px; color:#b91c1c;">
             Vui lòng sửa lại bảng so sánh cặp và tính toán lại.
           </div>`
    }
    </div>`;
}

async function runAhpPipeline() {
  const calculateBtn = document.getElementById("calculateBtn");
  if (calculateBtn) { calculateBtn.disabled = true; calculateBtn.textContent = "Đang xử lý..."; }

  ahpPipelineWeights = null;
  ahpPipelineValid = false;

  // Xóa kết quả cũ
  const container = getPipelineContainer();
  container.innerHTML = `<div style="padding:12px; font-size:12px; color:var(--muted); text-align:center;">⏳ Đang gọi API...</div>`;

  // Xóa hàng tổng cũ
  document.getElementById("ahpColSumRow")?.remove();

  const rawMatrix = getRawMatrix();

  try {
    // ── BƯỚC 1: column-sums ────────────────────────────
    const res1 = await apiFetch("/api/ahp/calculate/column-sums", {
      method: "POST",
      body: JSON.stringify({ criteriaMatrix: rawMatrix }),
    });
    renderColumnSumsRow(res1.column_sums || []);

    // ── BƯỚC 2: normalize-matrix ─────────────────────
    const res2 = await apiFetch("/api/ahp/calculate/normalize-matrix", {
      method: "POST",
      body: JSON.stringify({ criteriaMatrix: rawMatrix }),
    });

    // ── BƯỚC 3: priority-vector-and-cr ───────────────
    const res3 = await apiFetch("/api/ahp/calculate/priority-vector-and-cr", {
      method: "POST",
      body: JSON.stringify({
        raw_matrix: rawMatrix,
        normalized_matrix: res2.normalized_matrix,
      }),
    });

    // Hiển thị kết quả
    showPipelineStep(
      renderNormalizedMatrix(res2.normalized_matrix) +
      renderWeightsResult(res3)
    );

    if (res3.is_valid) {
      // Lưu weights dạng list [W1..W5]
      const wObj = res3.weights || {};
      ahpPipelineWeights = Object.values(wObj);
      ahpPipelineValid = true;

      // Gắn sự kiện cho nút Phân tích
      setTimeout(() => {
        const startBtn = document.getElementById("startAnalysisBtn");
        if (startBtn) startBtn.addEventListener("click", runFinalAnalysis);
      }, 0);
    }
  } catch (err) {
    showPipelineStep(`<div class="card" style="margin-top:12px; padding:14px;">
      <div style="color:#b91c1c; font-weight:700;">❌ Lỗi khi tính toán</div>
      <div style="font-size:12px; color:var(--muted); margin-top:6px;">${err.message}</div>
    </div>`);
    console.error("AHP pipeline error:", err);
  } finally {
    if (calculateBtn) { calculateBtn.disabled = false; calculateBtn.textContent = "Tính điểm và xếp hạng"; }
  }
}

async function runFinalAnalysis() {
  const btn = document.getElementById("startAnalysisBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Đang phân tích..."; }

  try {
    // Lấy filters
    const districtEl = document.getElementById("district");
    const wardEl = document.getElementById("ward");
    const street = document.getElementById("street")?.value.trim() || "";
    const cityText = getSelectText(districtEl, districtTomSelect);
    const wardText = getSelectText(wardEl, wardTomSelect);

    function normalizeForFilter(input) {
      if (!input) return null;
      return String(input).trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/\s+/g, " ").trim() || null;
    }

    const filters = {};
    if (cityText) filters.district = normalizeForFilter(cityText);
    if (wardText) filters.ward = normalizeForFilter(wardText);
    if (street) filters.street = normalizeForFilter(street);
    filters.limit = 50;

    const result = await apiFetch("/api/locations/execute-final-analysis", {
      method: "POST",
      body: JSON.stringify({ weights: ahpPipelineWeights, filters }),
    });

    // Lưu vào localStorage để map.html dùng
    localStorage.setItem("ahp:lastRequest", JSON.stringify({ weights: ahpPipelineWeights, filters }));
    localStorage.setItem("ahp:lastResponse", JSON.stringify(result));

    window.location.href = "map.html";
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = "🚀 Phân tích địa điểm"; }
    alert("❌ Lỗi khi phân tích: " + err.message);
    console.error("Final analysis error:", err);
  }
}

// Hiển thị ma trận để debug (sẽ được gửi cho BE)
function displayMatrixForDebugging(matrixData) {
  console.log("=== MA TRẬN GỬI CHO BE ===");
  console.log("\n📊 Criteria Matrix:");
  console.log("Tiêu chí:", matrixData.criteria);
  console.table(matrixData.criteriaMatrix);

  console.log("\n📍 Alternatives:", matrixData.alternatives);

  console.log("\n✅ Dữ liệu sẵn sàng gửi cho BE:");
  console.log(JSON.stringify(matrixData, null, 2));
}

// Nút tính toán - chạy AHP pipeline 4 bước qua API
const calculateBtn = document.getElementById("calculateBtn");
if (calculateBtn) {
  calculateBtn.addEventListener("click", runAhpPipeline);
}


// Hiển thị modal kết quả (sẽ dùng khi BE trả kết quả)
// Bỏ comment khi tích hợp BE API
/*
function showResultsModal(results) {
  const content = document.getElementById("resultsContent");
  content.innerHTML = "";

  // Sắp xếp phương án theo điểm
  const ranked = alternatives
    .map((alt, idx) => ({
      name: alt,
      score: results.finalScores[idx],
      index: idx,
    }))
    .sort((a, b) => b.score - a.score);

  // Hiển thị xếp hạng
  const rankingDiv = document.createElement("div");
  rankingDiv.innerHTML = `
        <div style="margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 12px; font-size: 14px; color: var(--text);">XẾP HẠNG PHƯƠNG ÁN:</div>
          ${ranked
      .map(
        (item, rank) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: ${rank === 0 ? "#eaf1ff" : "#f9fafb"
          }; border: 1px solid var(--border); border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 700; color: var(--primary); font-size: 18px; min-width: 30px;">#${rank + 1
          }</span>
                <span style="font-size: 13px; color: var(--text);">${item.name
          }</span>
              </div>
              <span style="font-weight: 700; color: var(--text); font-size: 14px;">${item.score.toFixed(
            2
          )}%</span>
            </div>
          `
      )
      .join("")}
        </div>
        
        <div style="margin-bottom: 20px; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid var(--border);">
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px; color: var(--text);">Trọng số tiêu chí:</div>
          ${criteria
      .map(
        (c, idx) => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px;">
              <span style="color: var(--muted);">${c}</span>
              <span style="color: var(--text); font-weight: 600;">${(
            results.criteriaWeights[idx] * 100
          ).toFixed(2)}%</span>
            </div>
          `
      )
      .join("")}
        </div>
        
        <div style="padding: 12px; background: #fff7ed; border-radius: 8px; border: 1px solid #fed7aa;">
          <div style="font-size: 12px; color: #9a3412;">
            <strong>Tỷ lệ nhất quán (CR):</strong> ${results.criteriaCR.CR.toFixed(
        3
      )}<br>
            ${results.criteriaCR.CR <= 0.1
      ? "✓ Kết quả nhất quán (CR ≤ 0.1)"
      : "⚠ Kết quả có thể không nhất quán (CR > 0.1)"
    }
          </div>
        </div>
      `;
  content.appendChild(rankingDiv);

  document.getElementById("resultsModal").classList.add("active");
}
*/

// Các phần tử modal
const resultsModal = document.getElementById("resultsModal");
const closeResultsBtn = document.getElementById("closeResultsBtn");
const saveResultsBtn = document.getElementById("saveResultsBtn");
const projectNameModal = document.getElementById("projectNameModal");
const projectNameInput = document.getElementById("projectNameInput");
const confirmBtn = document.getElementById("confirmBtn");
const userIcon = document.getElementById("userIcon");
const logoutBtn = document.getElementById("logoutBtn");
const personalInfoModal = document.getElementById("personalInfoModal");
const updatePersonalInfoBtn = document.getElementById("updatePersonalInfoBtn");
const personalInfoEls = {
  fullname: document.getElementById("pi-fullname"),
  email: document.getElementById("pi-email"),
  phone: document.getElementById("pi-phone"),
  password: document.getElementById("pi-password"),
  passwordConfirm: document.getElementById("pi-password-confirm"),
  msg: document.getElementById("pi-msg"),
};

// Đóng modal kết quả
if (closeResultsBtn) {
  closeResultsBtn.addEventListener("click", () => {
    resultsModal.classList.remove("active");
  });
}

if (resultsModal) {
  resultsModal.addEventListener("click", (e) => {
    if (e.target.id === "resultsModal") {
      e.target.classList.remove("active");
    }
  });
}

// Lưu kết quả hiện tại để lưu
let currentResults = null;

// Lưu kết quả
if (saveResultsBtn) {
  saveResultsBtn.addEventListener("click", () => {
    // Lưu kết quả hiện tại
    try {
      currentResults = calculateAHPScores();
      if (!currentResults) return;
    } catch (error) {
      alert("Lỗi khi tính toán lại: " + error.message);
      return;
    }

    projectNameModal.classList.add("active");
    projectNameInput.focus();
  });
}

// Xác nhận tên dự án
if (confirmBtn) {
  confirmBtn.addEventListener("click", async () => {
    const projectName = projectNameInput.value.trim();
    if (!projectName) {
      alert("Vui lòng nhập tên dự án!");
      return;
    }

    if (!currentResults) {
      try {
        currentResults = calculateAHPScores();
        if (!currentResults) return;
      } catch (error) {
        alert("Lỗi khi tính toán: " + error.message);
        return;
      }
    }

    const w = currentResults.criteriaWeights || [];
    const districtEl = document.getElementById("district");
    const wardEl = document.getElementById("ward");
    const streetEl = document.getElementById("street");
    const districtText = getSelectText(districtEl, districtTomSelect);
    const wardText = getSelectText(wardEl, wardTomSelect);
    const streetText = streetEl ? streetEl.value.trim() : "";

    const payload = {
      name: projectName,
      w_revenue: w[0] ?? null,
      w_access: w[1] ?? null,
      w_cost: w[2] ?? null,
      w_competition: w[3] ?? null,
      w_risk: w[4] ?? null,
      ...(districtText ? { district: districtText } : {}),
      ...(wardText ? { ward: wardText } : {}),
      ...(streetText ? { street: streetText } : {}),
    };

    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Đang tạo...";

      const response = await fetch(API_BASE_URL + "/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = data.detail || "Tạo dự án thất bại.";
        alert(msg);
        return;
      }

      projectNameModal.classList.remove("active");
      projectNameInput.value = "";
      currentResults = null;

      try {
        const criteriaMatrix = buildCriteriaMatrixFromWeights([
          payload.w_revenue,
          payload.w_access,
          payload.w_cost,
          payload.w_competition,
          payload.w_risk,
        ]);
        const filters = {
          district: payload.district || "",
          ward: payload.ward || "",
          street: payload.street || "",
        };
        const reqPayload = {
          criteriaMatrix,
          filters,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("ahp:lastRequest", JSON.stringify(reqPayload));
        localStorage.removeItem("ahp:lastResponse");
      } catch (e) {
        console.warn("Không thể lưu localStorage trước khi mở map:", e);
      }

      window.location.href = "map.html";
    } catch (error) {
      console.error("Lỗi khi tạo dự án:", error);
      alert("Lỗi kết nối tới backend.");
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Xác nhận";
    }
  });
}

// Đóng modal khi click bên ngoài
if (projectNameModal) {
  projectNameModal.addEventListener("click", (e) => {
    if (e.target.id === "projectNameModal") {
      e.target.classList.remove("active");
    }
  });
}

// Icon người dùng - hiển thị thông tin cá nhân
if (userIcon) {
  userIcon.addEventListener("click", () => {
    // Clear password fields to prevent stale autofill
    if (personalInfoEls.password) personalInfoEls.password.value = "";
    if (personalInfoEls.passwordConfirm) personalInfoEls.passwordConfirm.value = "";
    if (personalInfoEls.msg) personalInfoEls.msg.textContent = "";
    // Always reload fresh data each time modal opens
    loadPersonalInfo();
    personalInfoModal.classList.add("active");
  });
}

// Đăng xuất
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const response = await fetch(
        API_BASE_URL + "/api/XacThucTaiKhoan/logout",
        { method: "POST", credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`API ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "index.html";
    }
  });
}

async function loadPersonalInfo() {
  try {
    const response = await fetch(
      API_BASE_URL + "/api/XacThucTaiKhoan/me",
      { method: "GET", credentials: "include" }
    );

    if (!response.ok) {
      throw new Error(`API ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (personalInfoEls.fullname) {
      personalInfoEls.fullname.value = data.fullname || "";
    }
    if (personalInfoEls.email) {
      personalInfoEls.email.textContent = data.email || "--";
    }
    if (personalInfoEls.phone) {
      // Use phone (new) or sodienthoai (legacy)
      personalInfoEls.phone.value = data.phone || data.sodienthoai || "";
    }
  } catch (err) {
    console.error("Không thể tải thông tin cá nhân:", err);
  }
}

// loadPersonalInfo is now called on-demand from userIcon click,
// do NOT auto-call here to avoid stale data on page load for a different account.

// Đóng modal thông tin cá nhân
if (personalInfoModal) {
  personalInfoModal.addEventListener("click", (e) => {
    if (e.target.id === "personalInfoModal") {
      e.target.classList.remove("active");
    }
  });
}

async function updatePersonalInfo() {
  if (!updatePersonalInfoBtn) return;
  if (personalInfoEls.msg) {
    personalInfoEls.msg.textContent = "";
  }

  const fullname = personalInfoEls.fullname
    ? personalInfoEls.fullname.value.trim()
    : "";
  const sodienthoai = personalInfoEls.phone
    ? personalInfoEls.phone.value.trim()
    : "";
  const password = personalInfoEls.password
    ? personalInfoEls.password.value
    : "";
  const passwordConfirm = personalInfoEls.passwordConfirm
    ? personalInfoEls.passwordConfirm.value
    : "";

  if (password && password !== passwordConfirm) {
    if (personalInfoEls.msg) {
      personalInfoEls.msg.textContent = "Mật khẩu xác nhận không khớp.";
      personalInfoEls.msg.style.color = "#b91c1c";
    }
    return;
  }

  const payload = {
    fullname,
    phone: sodienthoai, // Using 'phone' to match new API structure
    password: password || undefined,
  };

  try {
    updatePersonalInfoBtn.disabled = true;
    updatePersonalInfoBtn.textContent = "Đang cập nhật...";

    const response = await fetch(
      API_BASE_URL + "/api/XacThucTaiKhoan/update-profile",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data.detail || "Cập nhật thất bại.";
      if (personalInfoEls.msg) {
        personalInfoEls.msg.textContent = msg;
        personalInfoEls.msg.style.color = "#b91c1c";
      }
      return;
    }

    if (personalInfoEls.msg) {
      personalInfoEls.msg.textContent = "Cập nhật thành công.";
      personalInfoEls.msg.style.color = "#15803d";
    }
  } catch (err) {
    console.error("Không thể cập nhật thông tin cá nhân:", err);
    if (personalInfoEls.msg) {
      personalInfoEls.msg.textContent = "Lỗi kết nối tới backend.";
      personalInfoEls.msg.style.color = "#b91c1c";
    }
  } finally {
    updatePersonalInfoBtn.disabled = false;
    updatePersonalInfoBtn.textContent = "Cập nhật thông tin";
  }
}

if (updatePersonalInfoBtn) {
  updatePersonalInfoBtn.addEventListener("click", updatePersonalInfo);
}

// Chức năng tìm kiếm
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const projectsListEl = document.getElementById("projectsList");

function renderProjects(items) {
  if (!projectsListEl) return;
  projectsListEl.innerHTML = "";

  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "project-item";
    empty.textContent = "Không có dự án phù hợp.";
    projectsListEl.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "project-item";
    const locationText = [item.street, item.ward, item.district]
      .filter(Boolean)
      .join(", ");
    const nameText = item.name
      ? `${item.name}${locationText ? " - " + locationText : ""}`
      : "(Không có tên)";
    const nameEl = document.createElement("span");
    nameEl.textContent = nameText;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "project-delete";
    deleteBtn.type = "button";
    deleteBtn.title = "Xóa dự án";
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M6 7L7 19C7.05201 19.5523 7.44772 20 8 20H16C16.5523 20 16.948 19.5523 17 19L18 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M10 11V16M14 11V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;

    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!item.id) return;
      if (!confirm("Bạn có chắc muốn xóa dự án này?")) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/projects/${item.id}`,
          { method: "DELETE", credentials: "include" }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          alert(data.detail || "Xóa dự án thất bại.");
          return;
        }
        await fetchProjects();
      } catch (err) {
        console.error("Lỗi khi xóa dự án:", err);
        alert("Lỗi kết nối tới backend.");
      }
    });

    row.appendChild(nameEl);
    row.appendChild(deleteBtn);

    row.addEventListener("click", () => {
      openProjectOnMap(item);
    });
    projectsListEl.appendChild(row);
  });
}

function buildCriteriaMatrixFromWeights(weights) {
  const n = weights.length;
  const round2 = (x) => Math.round(x * 100) / 100;
  const matrix = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const wi = Number(weights[i]);
      const wj = Number(weights[j]);
      if (!Number.isFinite(wi) || !Number.isFinite(wj) || wj === 0) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = round2(wi / wj);
      }
    }
  }
  return matrix;
}

function openProjectOnMap(item) {
  const weights = [
    item.w_revenue,
    item.w_access,
    item.w_cost,
    item.w_competition,
    item.w_risk,
  ].map(w => Number(w) || 0.2);

  const filters = {
    district: item.district || "",
    ward: item.ward || "",
    street: item.street || "",
    limit: 50,
  };

  try {
    const payload = {
      weights,
      filters,
      projectid: item.projectid ?? item.id ?? null,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("ahp:lastRequest", JSON.stringify(payload));
    localStorage.removeItem("ahp:lastResponse");
  } catch (err) {
    console.warn("Không thể lưu localStorage:", err);
  }

  window.location.href = "map.html";
}


let searchTimer = null;
async function fetchProjects(params) {
  try {
    const qs = params ? `?${params.toString()}` : "";
    const response = await fetch(
      `${API_BASE_URL}/api/projects${qs}`,
      { method: "GET", credentials: "include" }
    );

    if (!response.ok) {
      throw new Error(`API ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    renderProjects(data.items || []);
  } catch (err) {
    console.error("Lỗi khi tìm dự án:", err);
  }
}

async function performSearch() {
  if (!searchInput) return;
  const searchTerm = searchInput.value.trim();

  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("size", "10");
  if (searchTerm) params.set("name", searchTerm);

  await fetchProjects(params);
}

if (searchBtn) searchBtn.addEventListener("click", performSearch);
if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(performSearch, 300);
  });
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });
}

// Load initial projects without query params
fetchProjects();

// Đóng modal bằng phím Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    projectNameModal.classList.remove("active");
    personalInfoModal.classList.remove("active");
    resultsModal.classList.remove("active");
  }
});

const businessTypeEl = document.getElementById("businessType");
if (businessTypeEl) {
  new TomSelect(businessTypeEl, {
    create: true,
    placeholder: "Chọn hoặc nhập loại hình kinh doanh",
  });
}

async function initLocationSelects() {
  const districtEl = document.getElementById("district");
  const wardEl = document.getElementById("ward");
  if (!districtEl || !wardEl) return;

  try {
    const [quanRes, phuongRes] = await Promise.all([
      fetch("js/data/Quan.json"),
      fetch("js/data/Phuong.json"),
    ]);

    const [quanAll, phuongAll] = await Promise.all([
      quanRes.json(),
      phuongRes.json(),
    ]);

    const quanHCM = Array.isArray(quanAll)
      ? quanAll.filter((q) => q.idTinh === "1")
      : [];

    districtEl.innerHTML = "";
    const defaultDistrictOpt = document.createElement("option");
    defaultDistrictOpt.value = "";
    defaultDistrictOpt.textContent = "Chọn Quận";
    defaultDistrictOpt.disabled = true;
    defaultDistrictOpt.selected = true;
    districtEl.appendChild(defaultDistrictOpt);

    quanHCM.forEach((q) => {
      const opt = document.createElement("option");
      opt.value = q.id;
      opt.textContent = q.ten;
      districtEl.appendChild(opt);
    });

    wardEl.innerHTML = "";
    const defaultWardOpt = document.createElement("option");
    defaultWardOpt.value = "";
    defaultWardOpt.textContent = "Chọn Phường / Xã";
    defaultWardOpt.disabled = true;
    defaultWardOpt.selected = true;
    wardEl.appendChild(defaultWardOpt);

    districtTomSelect = new TomSelect(districtEl, {
      create: false,
      placeholder: "Chọn Quận",
    });

    wardTomSelect = new TomSelect(wardEl, {
      create: false,
      placeholder: "Chọn Phường / Xã",
    });

    function updateWardsForDistrict(districtId) {
      const wards = Array.isArray(phuongAll)
        ? phuongAll.filter((p) => p.idQuan === districtId)
        : [];

      wardTomSelect.clear();
      wardTomSelect.clearOptions();

      wards.forEach((w) => {
        wardTomSelect.addOption({ value: w.id, text: w.ten });
      });

      wardTomSelect.refreshOptions(false);
    }

    districtTomSelect.on("change", (value) => {
      if (!value) return;
      updateWardsForDistrict(value);
    });
  } catch (err) {
    console.error("Lỗi khi khởi tạo select quận/phường:", err);
  }
}

initLocationSelects();


