// API Config (same as result.js)
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

// Helpers
function cellClass(val) {
  if (val === '1') return 'cell-equal';
  if (String(val).includes('/')) return 'cell-worse';
  return 'cell-better';
}

function criteriaIcon(id) {
  const icons = { C1: 'C1', C2: 'C2', C3: 'C3', C4: 'C4', C5: 'C5' };
  return icons[id] || 'CR';
}

function formatCRMeta(cr) {
  const value = Number(cr);
  if (!Number.isFinite(value)) {
    return { text: 'CR: N/A', color: '#64748b', background: '#f8fafc', border: '#e2e8f0' };
  }
  if (value < 0.1) {
    return { text: 'CR: ' + value.toFixed(4), color: '#166534', background: '#f0fdf4', border: '#bbf7d0' };
  }
  if (value > 0.1) {
    return { text: 'CR: ' + value.toFixed(4), color: '#b91c1c', background: '#fff1f2', border: '#fecaca' };
  }
  return { text: 'CR: ' + value.toFixed(4), color: '#92400e', background: '#fffbeb', border: '#fde68a' };
}

function renderPanel(tab) {
  const { criteria_id, criteria_name, locations_header, matrix_rows, local_weights, cr } = tab;
  const n = locations_header.length;
  const crMeta = formatCRMeta(cr);

  let headerCols = '<th class="matrix-table th">Location \\ Location</th>';
  locations_header.forEach((loc) => {
    const label = typeof loc === 'object' ? loc.name : loc;
    headerCols += `<th title="${label}">${label.length > 20 ? label.slice(0, 18) + '...' : label}</th>`;
  });
  headerCols += '<th class="weight-header">Local Weight</th>';

  let bodyRows = '';
  for (let i = 0; i < n; i++) {
    const rowLabel = typeof locations_header[i] === 'object' ? locations_header[i].name : locations_header[i];
    const wPct = local_weights[i] !== undefined ? (local_weights[i] * 100).toFixed(2) + '%' : '-';

    let cells = `<td class="row-header" title="${rowLabel}">${rowLabel.length > 22 ? rowLabel.slice(0, 20) + '...' : rowLabel}</td>`;
    for (let j = 0; j < n; j++) {
      const val = matrix_rows[i] && matrix_rows[i][j] ? matrix_rows[i][j] : '-';
      cells += `<td class="${cellClass(String(val))}">${val}</td>`;
    }
    cells += `<td class="weight-cell">${wPct}</td>`;
    bodyRows += `<tr>${cells}</tr>`;
  }

  return `
    <div class="criteria-panel">
      <div class="criteria-panel-header">
        <div class="criteria-panel-badge">${criteria_id} - ${criteriaIcon(criteria_id)}</div>
        <div class="criteria-panel-title">${criteria_name}</div>
        <div class="criteria-panel-desc">Pairwise matrix ${n}x${n} locations for this criterion</div>
        <div style="margin-top:8px;display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;border:1px solid ${crMeta.border};background:${crMeta.background};color:${crMeta.color};font-size:12px;font-weight:700;">
          ${crMeta.text}
        </div>
      </div>

      <div class="matrix-wrap">
        <table class="matrix-table">
          <thead><tr>${headerCols}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const summaryEl = document.getElementById('summary-info');
  const setSummary = (html) => {
    if (summaryEl) summaryEl.innerHTML = html;
  };
  const tabsEl = document.getElementById('criteriaTabs');
  const panelEl = document.getElementById('criteriaPanel');

  const lastRequestStr = localStorage.getItem('ahp:lastRequest');
  if (!lastRequestStr) {
    setSummary(`
      <div style="color:#b91c1c; font-weight:600;">
        No saved weights found. Please go back to Dashboard and run AHP weight calculation.
      </div>`);
    panelEl.innerHTML = '';
    return;
  }

  let payload;
  try {
    const req = JSON.parse(lastRequestStr);
    if (!req.weights || req.weights.length !== 5) {
      setSummary('<div style="color:#b91c1c;">Invalid weights data (must have exactly 5 items). Please recalculate on Dashboard.</div>');
      panelEl.innerHTML = '';
      return;
    }
    payload = { weights: req.weights, filters: req.filters || {} };
  } catch {
    setSummary('<div style="color:#b91c1c;">Stored data is corrupted. Please recalculate on Dashboard.</div>');
    panelEl.innerHTML = '';
    return;
  }

  setSummary('<div class="state-loading">Loading criteria matrix...</div>');
  panelEl.innerHTML = '';

  let data;
  try {
    data = await apiFetch('/api/locations/criteria-evaluation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('criteria-evaluation API error:', err);
    setSummary(`<div class="state-error">Cannot connect to server.<br><small>${err.message}</small></div>`);
    return;
  }

  if (!data || !data.success || !Array.isArray(data.tabs) || data.tabs.length === 0) {
    setSummary('<div class="state-error">No matrix data returned. Server may not find matching locations.</div>');
    return;
  }

  const tabs = data.tabs;
  const total = data.total_locations || 0;

  const filterDesc = payload.filters?.district
    ? `District: <strong>${payload.filters.district}</strong>`
    : 'All areas';

  setSummary(`
    <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
      <div style="font-size:24px;">AHP</div>
      <div style="flex:1; min-width:220px;">
        <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">
          Matrix evaluation completed. <span style="color:#6366f1;">${total}</span> locations analyzed across <span style="color:#6366f1;">${tabs.length}</span> criteria
        </div>
        <div style="color:#64748b; font-size:13px;">
          Filter: ${filterDesc} &nbsp;&middot;&nbsp;
          Weights: [${payload.weights.map((w) => w.toFixed(4)).join(', ')}]
        </div>
      </div>
    </div>
  `);

  let activeIndex = 0;
  tabsEl.innerHTML = tabs.map((tab, i) => `
    <button
      class="criteria-tab-btn${i === 0 ? ' active' : ''}"
      id="tab-btn-${i}"
      onclick="switchTab(${i})"
    >
      ${criteriaIcon(tab.criteria_id)} · ${tab.criteria_name}
    </button>
  `).join('');

  panelEl.innerHTML = renderPanel(tabs[0]);

  window.switchTab = function (index) {
    if (index === activeIndex) return;

    document.getElementById(`tab-btn-${activeIndex}`)?.classList.remove('active');
    document.getElementById(`tab-btn-${index}`)?.classList.add('active');
    activeIndex = index;

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
