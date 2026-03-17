// ── API Config (giống result.js) ──────────────────────────────────────────
const API_BASE_URL = 'https://audrina-subultimate-ghostily.ngrok-free.dev';

async function apiFetch(path, options = {}) {
  const url = API_BASE_URL + path;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API error ${response.status} ${response.statusText}: ${errorText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Trả về class CSS màu ô dựa trên giá trị AHP string.
 * "1"       → tương đương → trắng
 * số > 1    → hàng tốt hơn → xanh lá
 * "1/x"     → hàng kém hơn → đỏ nhạt
 */
function cellClass(val) {
  if (val === '1') return 'cell-equal';
  if (val.includes('/')) return 'cell-worse';   // dạng "1/3", "1/5"…
  return 'cell-better';                          // dạng "3", "5"…
}

/**
 * Tạo emoji/icon phù hợp theo criteria_id để icon hoá tab.
 */
function criteriaIcon(id) {
  const icons = { C1: '💰', C2: '🚗', C3: '🏷️', C4: '🏆', C5: '🛡️' };
  return icons[id] || '📊';
}

// ── Render một tab panel ──────────────────────────────────────────────────
function renderPanel(tab) {
  const { criteria_id, criteria_name, locations_header, matrix_rows, local_weights } = tab;
  const n = locations_header.length;

  // Build column headers (địa điểm)
  let headerCols = '<th class="matrix-table th">Địa điểm \\ Địa điểm</th>';
  locations_header.forEach(loc => {
    const label = typeof loc === 'object' ? loc.name : loc;
    headerCols += `<th title="${label}">${label.length > 20 ? label.slice(0, 18) + '…' : label}</th>`;
  });
  headerCols += '<th class="weight-header">Local Weight</th>';

  // Build data rows
  let bodyRows = '';
  for (let i = 0; i < n; i++) {
    const rowLabel = typeof locations_header[i] === 'object' ? locations_header[i].name : locations_header[i];
    const wPct = local_weights[i] !== undefined
      ? (local_weights[i] * 100).toFixed(2) + '%'
      : '—';

    let cells = `<td class="row-header" title="${rowLabel}">${rowLabel.length > 22 ? rowLabel.slice(0, 20) + '…' : rowLabel}</td>`;
    for (let j = 0; j < n; j++) {
      const val = (matrix_rows[i] && matrix_rows[i][j]) ? matrix_rows[i][j] : '—';
      cells += `<td class="${cellClass(val)}">${val}</td>`;
    }
    cells += `<td class="weight-cell">${wPct}</td>`;
    bodyRows += `<tr>${cells}</tr>`;
  }

  return `
    <div class="criteria-panel">
      <div class="criteria-panel-header">
        <div class="criteria-panel-badge">${criteria_id} — ${criteriaIcon(criteria_id)}</div>
        <div class="criteria-panel-title">${criteria_name}</div>
        <div class="criteria-panel-desc">Ma trận so sánh cặp ${n}×${n} địa điểm theo tiêu chí này</div>
      </div>

      <div class="matrix-wrap">
        <table class="matrix-table">
          <thead><tr>${headerCols}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>

      <div class="legend">
        <div class="legend-item">
          <div class="legend-dot" style="background:#f0fdf4; border:1px solid #bbf7d0;"></div>
          <span>Tốt hơn (số nguyên &gt; 1)</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot" style="background:#fff1f2; border:1px solid #fecaca;"></div>
          <span>Kém hơn (dạng 1/x)</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot" style="background:#fff; border:1px solid #e2e8f0;"></div>
          <span>Tương đương ("1")</span>
        </div>
        <div class="legend-item" style="margin-left:auto;">
          <div class="legend-dot" style="background:#eef2ff; border:1px solid #c7d2fe;"></div>
          <span>Local Weight = mức ưu tiên địa điểm theo tiêu chí này</span>
        </div>
      </div>
    </div>
  `;
}

// ── Main ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const summaryEl = document.getElementById('summary-info');
  const tabsEl    = document.getElementById('criteriaTabs');
  const panelEl   = document.getElementById('criteriaPanel');

  // 1. Đọc payload từ localStorage
  const lastRequestStr = localStorage.getItem('ahp:lastRequest');
  if (!lastRequestStr) {
    summaryEl.innerHTML = `
      <div style="color:#b91c1c; font-weight:600;">
        ⚠️ Không tìm thấy dữ liệu trọng số. Vui lòng quay lại Dashboard và hoàn thành bước tính trọng số AHP.
      </div>`;
    panelEl.innerHTML = '';
    return;
  }

  let payload;
  try {
    const req = JSON.parse(lastRequestStr);
    if (!req.weights || req.weights.length !== 5) {
      summaryEl.innerHTML = `<div style="color:#b91c1c;">Dữ liệu weights không hợp lệ (cần đúng 5 phần tử). Hãy tính lại tại Dashboard.</div>`;
      panelEl.innerHTML = '';
      return;
    }
    payload = { weights: req.weights, filters: req.filters || {} };
  } catch {
    summaryEl.innerHTML = `<div style="color:#b91c1c;">Dữ liệu lưu trữ bị hỏng. Vui lòng tính lại tại Dashboard.</div>`;
    panelEl.innerHTML = '';
    return;
  }

  // 2. Loading state
  summaryEl.innerHTML = `<div class="state-loading">⏳ Đang phân tích ma trận tiêu chí...</div>`;
  panelEl.innerHTML   = '';

  // 3. Gọi API
  let data;
  try {
    data = await apiFetch('/api/locations/criteria-evaluation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('criteria-evaluation API error:', err);
    summaryEl.innerHTML = `<div class="state-error">❌ Không thể kết nối đến server.<br><small>${err.message}</small></div>`;
    return;
  }

  // 4. Kiểm tra response
  if (!data || !data.success || !Array.isArray(data.tabs) || data.tabs.length === 0) {
    summaryEl.innerHTML = `<div class="state-error">⚠️ Không có dữ liệu ma trận trả về. Server có thể chưa tìm được địa điểm phù hợp.</div>`;
    return;
  }

  const tabs = data.tabs;
  const total = data.total_locations || 0;

  // 5. Render summary card
  const filterDesc = payload.filters?.district
    ? `Quận: <strong>${payload.filters.district}</strong>`
    : 'Toàn bộ khu vực';

  summaryEl.innerHTML = `
    <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
      <div style="font-size:24px;">📊</div>
      <div style="flex:1; min-width:220px;">
        <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">
          Đánh giá ma trận thành công! <span style="color:#6366f1;">${total}</span> địa điểm được phân tích theo <span style="color:#6366f1;">${tabs.length}</span> tiêu chí
        </div>
        <div style="color:#64748b; font-size:13px;">
          Bộ lọc: ${filterDesc} &nbsp;·&nbsp;
          Trọng số: [${payload.weights.map(w => w.toFixed(4)).join(', ')}]
        </div>
      </div>
    </div>
  `;

  // 6. Render tab buttons
  let activeIndex = 0;
  tabsEl.innerHTML = tabs.map((tab, i) => `
    <button
      class="criteria-tab-btn${i === 0 ? ' active' : ''}"
      id="tab-btn-${i}"
      onclick="switchTab(${i})"
    >
      ${criteriaIcon(tab.criteria_id)} ${tab.criteria_id} · ${tab.criteria_name}
    </button>
  `).join('');

  // 7. Render panel đầu tiên
  panelEl.innerHTML = renderPanel(tabs[0]);

  // 8. Hàm chuyển tab (global để onclick hoạt động)
  window.switchTab = function (index) {
    if (index === activeIndex) return;

    document.getElementById(`tab-btn-${activeIndex}`)?.classList.remove('active');
    document.getElementById(`tab-btn-${index}`)?.classList.add('active');
    activeIndex = index;

    // Fade animation
    panelEl.style.opacity = '0';
    panelEl.style.transform = 'translateY(6px)';
    panelEl.style.transition = 'opacity 0.18s, transform 0.18s';

    setTimeout(() => {
      panelEl.innerHTML = renderPanel(tabs[index]);
      panelEl.style.opacity = '1';
      panelEl.style.transform = 'translateY(0)';
    }, 180);
  };
});
