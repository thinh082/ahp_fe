// Render bản đồ từ API /api/locations/calculate-ahp

// 1. Khởi tạo bản đồ
const map = L.map('map').setView([10.7769, 106.7009], 13);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// 2. Utility
function normalizeForFilter(input) {
    if (input === null || input === undefined) return null;
    const s = String(input).trim();
    if (!s) return null;
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\s+/g, ' ')
        .trim();
}

function safeNum(x, fallback = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
}

function formatAHP(val) {
    const n = safeNum(val, null);
    if (n === null) return '-';
    return n.toFixed(4);
}

function ahpToRadius(score) {
    // scale nhẹ để marker dễ nhìn
    const s = safeNum(score, 0);
    return Math.max(5, Math.min(14, 4 + s)); // clamp
}

function ratingToEmoji(rating) {
    if (!rating) return '';
    if (rating.includes('NÊN')) return '✅';
    if (rating.includes('CÂN NHẮC')) return '⚖️';
    if (rating.includes('KHÔNG')) return '⛔';
    return '';
}

// 3. State + Layers
let lastAHPResponse = null;
let markersLayer = L.layerGroup().addTo(map);
let clustersLayer = L.layerGroup().addTo(map);
let searchCircle = null; // vòng tròn tìm kiếm hiện tại

let currentFilters = {
    district: '',
    ward: '',
    street: ''
};

// 4. AHP Criteria UI (pairwise sliders) -> dynamic matrix
const criteria = [
    'C1_revenue_potential',
    'C2_accessibility',
    'C3_cost',
    'C4_competition',
    'C5_risk_stability'
];

const criteriaLabels = {
    C1_revenue_potential: 'Tiềm năng doanh thu',
    C2_accessibility: 'Tiếp cận & vị trí',
    C3_cost: 'Chi phí',
    C4_competition: 'Cạnh tranh',
    C5_risk_stability: 'Ổn định / Rủi ro'
};

const criteriaPairs = [];
for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
        criteriaPairs.push({ i, j, value: 1 });
    }
}

let currentCriteriaMatrix = null;
let oldCriteriaMatrix = null; // ma trận cũ (baseline) để compare-weights

// Location đang chọn (lấy criteria_scores khi click marker)
let selectedCriteriaScores = null;
let selectedLocationLabel = null;

// Compare mode: bấm "So sánh" ở popup -> chọn marker thứ 2 để so sánh
let compareBase = null; // { loc, cluster, label }
let waitingCompareTarget = false;
let lastClicked = null; // { loc, cluster, label }
let lastHovered = null; // { loc, cluster, label }

let favoriteLocationIds = new Set();

async function loadFavoriteLocations() {
    favoriteLocationIds = new Set();
    let projectId = null;
    try {
        const reqRaw = localStorage.getItem('ahp:lastRequest');
        if (reqRaw) {
            const req = JSON.parse(reqRaw);
            projectId = req?.projectid ?? null;
        }
    } catch (_) {
        // ignore
    }

    if (!projectId) return;

    try {
        const resp = await fetch(`${API_BASE_URL}/api/projects/${projectId}/favorite-locations`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        favoriteLocationIds = new Set(items.map((x) => Number(x)).filter((x) => Number.isFinite(x)));
    } catch (e) {
        console.error('Load favorites error:', e);
    }
}

function setMapPickMode(isOn) {
    const el = document.getElementById('map');
    if (!el) return;
    el.style.cursor = isOn ? 'crosshair' : '';
}

async function callCompareWeights(newMatrix) {
    const body = {
        criteriaMatrix: newMatrix,
        old_criteriaMatrix: oldCriteriaMatrix,
        criteria_scores: selectedCriteriaScores
    };
    return await apiFetch('/api/locations/compare-weights', {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

function showCompareResult(compareResp) {
    const el = document.getElementById('criteriaCompareResult');
    if (!el) return;

    // Ưu tiên HTML từ BE
    if (compareResp && typeof compareResp.summary_html === 'string' && compareResp.summary_html.trim()) {
        el.innerHTML = compareResp.summary_html;
        return;
    }

    // Fallback text nếu BE chưa trả summary_html
    const txt = compareResp?.comparison_text
        || `Điểm AHP: ${compareResp?.old_ahp_score ?? '-'} → ${compareResp?.new_ahp_score ?? '-'}`
        || 'Đã so sánh tiêu chí.';
    el.innerHTML = `<div style="padding:16px; border:1px solid rgba(99, 102, 241, 0.15); border-radius:18px; background:#fff; box-shadow:0 10px 30px rgba(0,0,0,0.04);">
        <div style="font-weight:800; margin-bottom:10px; color:#4f46e5; display:flex; align-items:center; gap:8px; font-size:14px;">
            <span style="font-size:18px;">📉</span> So sánh tiêu chí
        </div>
        <div style="color:#475569; font-size:13px; line-height:1.6;">${txt}</div>
    </div>`;
}

function renderCriteriaPairsUI() {
    const listEl = document.getElementById('criteriaListAHP');
    if (!listEl) return;
    listEl.innerHTML = '';

    criteriaPairs.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'c-row';

        const left = document.createElement('div');
        left.className = 'c-left';
        left.textContent = criteriaLabels[criteria[p.i]] || criteria[p.i];

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '9';
        slider.step = '1';
        slider.value = String(p.value);

        const score = document.createElement('div');
        score.className = 'c-score';
        score.textContent = slider.value;

        const right = document.createElement('div');
        right.className = 'c-right';
        right.textContent = criteriaLabels[criteria[p.j]] || criteria[p.j];

        slider.addEventListener('input', () => {
            score.textContent = slider.value;
            criteriaPairs[idx].value = Number(slider.value);
        });

        row.append(left, slider, score, right);
        listEl.appendChild(row);
    });
}

function buildCriteriaMatrixFromUI() {
    const n = criteria.length;
    const round2 = (x) => Math.round(x * 100) / 100;
    const m = Array.from({ length: n }, () => Array.from({ length: n }, () => 1));

    criteriaPairs.forEach((p) => {
        const i = p.i;
        const j = p.j;
        const v = Number(p.value) || 1;
        m[i][j] = round2(v);
        m[j][i] = v === 0 ? 0 : round2(1 / v);
    });
    return m;
}

// Đồng bộ UI slider theo 1 criteriaMatrix (lấy tam giác trên)
function setCriteriaUIFromMatrix(matrix) {
    if (!Array.isArray(matrix) || matrix.length !== criteria.length) return;
    criteriaPairs.forEach((p) => {
        const v = Number(matrix?.[p.i]?.[p.j]);
        // slider chỉ nhận 1..9 (int)
        const clamped = Number.isFinite(v) ? Math.max(1, Math.min(9, Math.round(v))) : 1;
        p.value = clamped;
    });
    // re-render để slider reflect giá trị mới
    renderCriteriaPairsUI();
}

function buildFiltersForAPI() {
    const f = {};
    if (currentFilters.district) f.district = normalizeForFilter(currentFilters.district);
    if (currentFilters.ward) f.ward = normalizeForFilter(currentFilters.ward);
    if (currentFilters.street) f.street = normalizeForFilter(currentFilters.street);
    // limit cố định 50 theo mẫu (có thể đổi sau)
    f.limit = 50;
    return f;
}

async function fetchCalculateAHP() {
    // Lấy weights từ localStorage (được lưu từ dashboard sau pipeline bước 3)
    let weights = null;
    try {
        const reqRaw = localStorage.getItem('ahp:lastRequest');
        if (reqRaw) {
            const req = JSON.parse(reqRaw);
            weights = Array.isArray(req?.weights) ? req.weights : null;
        }
    } catch (_) { }

    // Fallback: trọng số đều nhau nếu không có
    if (!weights || weights.length !== 5) {
        weights = [0.2, 0.2, 0.2, 0.2, 0.2];
    }

    const body = {
        weights: weights,
        filters: buildFiltersForAPI()
    };
    return await apiFetch('/api/locations/execute-final-analysis', {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

// 5. Render từ response schema mới
function clearMapLayers() {
    markersLayer.clearLayers();
    clustersLayer.clearLayers();
    if (searchCircle) {
        map.removeLayer(searchCircle);
        searchCircle = null;
    }
}

function updateLegendFromClusters(clusters) {
    const container = document.getElementById('legend-list');
    if (!container) return;
    container.innerHTML = '';

    // ── Clusters as chips ──
    container.innerHTML += `<div class="legend-section-label">📍 Cụm (Cluster)</div>`;
    const clusterChipsHtml = (clusters || []).map(c => `
        <span class="legend-chip" style="background:${c.color}12; color:${c.color}; border-color:${c.color}33;">
            <svg width="12" height="15" viewBox="0 0 24 24" fill="none" style="margin-right:4px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${c.color}"/>
            </svg>
            ${c.cluster_name || ('Cụm ' + c.cluster_id)}
        </span>
    `).join('');
    container.innerHTML += `<div class="legend-chips">${clusterChipsHtml}</div>`;

    // ── Rating as chips ──
    container.innerHTML += `<div class="legend-section-label" style="margin-top:14px;">⭐ Đánh giá</div>`;
    container.innerHTML += `
        <div class="legend-chips">
            <span class="legend-chip chip-nen">✅ NÊN</span>
            <span class="legend-chip chip-cannhac">⚖️ CÂN NHẮC</span>
            <span class="legend-chip chip-khongnen">⛔ KHÔNG NÊN</span>
        </div>
    `;
}

function ratingToColor(rating) {
    if (!rating) return '#64748b';
    if (rating.includes('KHÔNG')) return '#ef4444';
    if (rating.includes('CÂN NHẮC')) return '#f59e0b';
    if (rating.includes('NÊN')) return '#22c55e';
    return '#64748b';
}

function showLocationCompareMessage(html) {
    const el = document.getElementById('compareModalResult');
    if (!el) return;

    el.innerHTML = html;

    // Hiện modal
    if (typeof window.openCompareModal === 'function') {
        window.openCompareModal();
    }

}

function renderLocationCompare(base, target) {
    const baseScore = safeNum(base.loc.ahp_score, null);
    const targetScore = safeNum(target.loc.ahp_score, null);
    const delta = (baseScore !== null && targetScore !== null) ? (targetScore - baseScore) : null;
    const deltaText = delta === null ? '-' : `${delta >= 0 ? '+' : ''}${delta.toFixed(4)}`;
    
    // Choose color for delta to emphasize positive/negative change
    const deltaColor = delta > 0 ? '#16a34a' : (delta < 0 ? '#dc2626' : '#64748b');
    const deltaBg = delta > 0 ? '#f0fdf4' : (delta < 0 ? '#fef2f2' : '#f1f5f9');
    const deltaBorder = delta > 0 ? '#bbf7d0' : (delta < 0 ? '#fecaca' : '#e2e8f0');

    const ratingColorBase = ratingToColor(base.loc.rating);
    const ratingEmojiBase = ratingToEmoji(base.loc.rating);
    const ratingColorTarget = ratingToColor(target.loc.rating);
    const ratingEmojiTarget = ratingToEmoji(target.loc.rating);

    // Helper to generate criteria HTML with progress bars
    const getCriteriaHtml = (loc) => {
        if (!loc.criteria_scores) return '<div style="font-size:13px; color:#94a3b8; margin-top:12px; font-style: italic; text-align: center;">Chưa có điểm thành phần</div>';
        
        let html = '<div style="margin-top:16px; display: flex; flex-direction: column; gap: 10px;">';
        criteria.forEach(c => {
            const val = loc.criteria_scores[c];
            const displayVal = val !== undefined ? formatAHP(val) : '-';
            const percentage = val !== undefined ? Math.min(Math.max(val * 100, 0), 100) : 0; // Convert to roughly 0-100%
            
            const prefixMatch = c.match(/^(C[1-5])/);
            const prefix = prefixMatch ? prefixMatch[1] : c;
            const fullLabel = criteriaLabels[c];

            html += `
                <div style="display:flex; flex-direction: column; gap: 4px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:12px;">
                        <span style="color:#475569; font-weight: 600;" title="${fullLabel}">${prefix} - <span style="font-weight: 500; color: #64748b;">${fullLabel}</span></span>
                        <span style="font-weight:700; color:#3b82f6;">${displayVal}</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #60a5fa, #3b82f6); border-radius: 99px; transition: width 0.5s ease-out;"></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    };

    const criteriaBaseHtml = getCriteriaHtml(base.loc);
    const criteriaTargetHtml = getCriteriaHtml(target.loc);

    showLocationCompareMessage(`
        <div style="padding:4px; font-family: 'Inter', sans-serif;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(99,102,241,0.15);">
                    🔁
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px;">So sánh chi tiết</h3>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Phân tích điểm AHP và các tiêu chí giữa 2 vị trí</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom:20px; background:${deltaBg}; padding:12px 16px; border-radius:14px; border:1px solid ${deltaBorder};">
                <span style="font-size: 14px; font-weight: 600; color: #475569;">Chênh lệch AHP (Mới - Gốc)</span>
                <span style="font-size: 16px; font-weight: 800; color: ${deltaColor};">${deltaText}</span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <!-- Card GỐC -->
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px rgba(226, 232, 240, 0.4); display: flex; flex-direction: column;">
                    <div style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; background: #f1f5f9; border-radius: 8px; font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; margin-bottom: 12px; align-self: flex-start;">
                        ĐỊA ĐIỂM GỐC
                    </div>
                    
                    <div style="font-size:15px; font-weight:700; color:#0f172a; margin-bottom:8px; line-height:1.4; flex-grow: 1;">
                        ${base.label}
                    </div>
                    
                    <div style="margin-top: 4px; display:flex; align-items: baseline; gap: 6px;">
                        <span style="font-size:12px; font-weight: 600; color:#64748b;">Tổng AHP:</span>
                        <span style="font-size:18px; font-weight:800; color:#4f46e5;">${formatAHP(base.loc.ahp_score)}</span>
                    </div>
                    
                    <div style="height: 1px; background: #e2e8f0; margin: 16px 0;"></div>
                    
                    <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Điểm thành phần</div>
                    ${criteriaBaseHtml}
                    
                    <div style="margin-top:20px; display:flex; justify-content: center;">
                        <div style="display:inline-flex; align-items: center; gap: 6px; padding:6px 14px; border-radius:99px; font-size:12px; font-weight:700; background:${ratingColorBase}15; color:${ratingColorBase}; border:1px solid ${ratingColorBase}30;">
                            <span>${ratingEmojiBase}</span> <span>${base.loc.rating || 'Chưa phân loại'}</span>
                        </div>
                    </div>
                </div>

                <!-- Card MỚI -->
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px rgba(226, 232, 240, 0.4); display: flex; flex-direction: column; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6);"></div>
                    <div style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; background: #eef2ff; border-radius: 8px; font-size: 11px; font-weight: 800; color: #4f46e5; letter-spacing: 0.5px; margin-bottom: 12px; align-self: flex-start;">
                        ĐỊA ĐIỂM SO SÁNH
                    </div>
                    
                    <div style="font-size:15px; font-weight:700; color:#0f172a; margin-bottom:8px; line-height:1.4; flex-grow: 1;">
                        ${target.label}
                    </div>
                    
                    <div style="margin-top: 4px; display:flex; align-items: baseline; gap: 6px;">
                        <span style="font-size:12px; font-weight: 600; color:#64748b;">Tổng AHP:</span>
                        <span style="font-size:18px; font-weight:800; color:#4f46e5;">${formatAHP(target.loc.ahp_score)}</span>
                    </div>
                    
                    <div style="height: 1px; background: #e2e8f0; margin: 16px 0;"></div>
                    
                    <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Điểm thành phần</div>
                    ${criteriaTargetHtml}
                    
                    <div style="margin-top:20px; display:flex; justify-content: center;">
                        <div style="display:inline-flex; align-items: center; gap: 6px; padding:6px 14px; border-radius:99px; font-size:12px; font-weight:700; background:${ratingColorTarget}15; color:${ratingColorTarget}; border:1px solid ${ratingColorTarget}30;">
                            <span>${ratingEmojiTarget}</span> <span>${target.loc.rating || 'Chưa phân loại'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

function renderAHPResponse(resp) {
    lastAHPResponse = resp;
    clearMapLayers();

    const clusters = Array.isArray(resp?.clusters) ? resp.clusters : [];
    const allLatLngs = [];
    let totalScore = 0;
    let totalLocations = 0;

    // Cluster circles + labels
    clusters.forEach(cluster => {
        const centerLat = safeNum(cluster?.center?.lat, null);
        const centerLng = safeNum(cluster?.center?.lng, null);
        const radius = safeNum(cluster?.radius, null);
        const color = cluster?.color || '#64748b';
        if (centerLat === null || centerLng === null || radius === null) return;

        L.circle([centerLat, centerLng], {
            color,
            fillColor: color,
            fillOpacity: 0.12,
            radius,
            weight: 1,
            dashArray: '6, 6'
        }).addTo(clustersLayer).bindTooltip(
            `<b>${cluster.cluster_name || ('Cluster ' + cluster.cluster_id)}</b><br/>Avg AHP: ${formatAHP(cluster.avg_ahp_score)}`,
            { permanent: false, direction: 'center', className: 'cluster-label' }
        );
    });

    // Markers
    clusters.forEach(cluster => {
        const color = cluster?.color || '#64748b';
        const locations = Array.isArray(cluster?.locations) ? cluster.locations : [];
        locations.forEach(loc => {
            const lat = safeNum(loc.lat, null);
            const lng = safeNum(loc.lng, null);
            if (lat === null || lng === null) return;

            const score = safeNum(loc.ahp_score, 0);
            totalScore += score;
            totalLocations += 1;
            allLatLngs.push([lat, lng]);

            const popupTitle = `${loc.district || ''} - ${loc.street || ''}`.trim().replace(/^\-\s*/, '');
            const rating = loc.rating || '';
            const isFav = favoriteLocationIds.has(Number(loc.id));

            // Build rating badge style
            const ratingColor = ratingToColor(rating);
            const ratingEmoji = ratingToEmoji(rating);
            let ratingBadgeClass = '';
            if (rating.includes('NÊN') && !rating.includes('KHÔNG')) ratingBadgeClass = 'chip-nen';
            else if (rating.includes('CÂN NHẮC')) ratingBadgeClass = 'chip-cannhac';
            else ratingBadgeClass = 'chip-khongnen';

            const popupContent = `
                <div class="pp-header">
                    <div class="pp-rating-badge ${ratingBadgeClass}">${ratingEmoji} ${rating || 'Chưa xếp loại'}</div>
                    <div class="pp-title">${popupTitle || ('Địa điểm #' + loc.id)}</div>
                    <div class="pp-score">AHP score: <strong>${formatAHP(loc.ahp_score)}</strong></div>
                    <div class="pp-cluster">Cụm: ${cluster.cluster_name || cluster.cluster_id}</div>
                </div>
                <div class="pp-body">
                    <button onclick="showCriteriaPanel()" class="pp-action-btn pp-btn-criteria">
                        <span class="pp-btn-icon">📊</span>Tiêu chí
                    </button>
                    <button class="pp-action-btn pp-btn-compare btn-compare">
                        <span class="pp-btn-icon">🔁</span>So sánh
                    </button>
                    <button class="pp-action-btn pp-btn-fav btn-favorite" data-location-id="${loc.id}">
                        <span class="pp-btn-icon">${isFav ? '❤️' : '🤍'}</span>${isFav ? 'Yêu thích' : 'Yêu thích'}
                    </button>
                </div>
            `;

            // Custom Pin SVG with cluster color
            const pinSvg = `
                <svg class="pin-marker" width="28" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${color}"/>
                    <circle cx="12" cy="10" r="3" fill="white"/>
                </svg>
            `;

            const customIcon = L.divIcon({
                html: pinSvg,
                className: 'custom-pin-icon',
                iconSize: [28, 34],
                iconAnchor: [14, 34],
                popupAnchor: [0, -34]
            });

            const marker = L.marker([lat, lng], {
                icon: customIcon
            }).addTo(markersLayer);

            const popup = L.popup({
                offset: L.point(0, -5),
                closeButton: false,
                autoPan: false
            }).setContent(popupContent);
            marker.bindPopup(popup);

            let timer;
            marker.on('mouseover', function () {
                if (timer) clearTimeout(timer);
                this.openPopup();
                lastHovered = { loc, cluster, label: popupTitle || (`Location #${loc.id}`) };
            });
            marker.on('mouseout', function () {
                timer = setTimeout(() => { this.closePopup(); }, 1200);
            });

            // Khi click marker
            marker.on('click', function () {
                if (waitingCompareTarget && compareBase) {
                    if ((compareBase.loc?.id ?? null) === (loc?.id ?? null)) return;
                    const target = { loc, cluster, label: popupTitle || (`Location #${loc.id}`) };
                    renderLocationCompare(compareBase, target);
                    waitingCompareTarget = false;
                    compareBase = null;
                    setMapPickMode(false);
                    return;
                }

                selectedCriteriaScores = loc.criteria_scores || null;
                selectedLocationLabel = popupTitle || (`Location #${loc.id}`);
                lastClicked = { loc, cluster, label: selectedLocationLabel };

                if (typeof window.showCriteriaPanel === 'function') {
                    window.showCriteriaPanel();
                }

                const resultEl = document.getElementById('criteriaCompareResult');
                if (resultEl) {
                    resultEl.innerHTML = `<div style="padding:10px; border:1px solid rgba(99, 102, 241, 0.15); border-radius:18px; background:#fff; box-shadow:0 10px 30px rgba(0,0,0,0.04);">
                        <div style="font-weight:800; margin-bottom:10px; color:#4f46e5; display:flex; align-items:center; gap:8px; font-size:14px;">
                            <span style="font-size:18px;">📍</span> Địa điểm đang chọn
                        </div>
                        <div style="color:#475569; font-size:13px; line-height:1.6;">${selectedLocationLabel}</div>
                        <div style="color:#64748b; font-size:12px; margin-top:8px; background:rgba(99,102,241,0.05); padding:8px 12px; border-radius:10px;">Chỉnh slider rồi bấm <b>“Áp dụng tiêu chí”</b> để xem so sánh.</div>
                    </div>`;
                }
            });
        });
    });

    // Fit bounds
    if (allLatLngs.length > 0) {
        map.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 50] });
    }

    // Stats
    const totalEl = document.getElementById('total-locations');
    const avgEl = document.getElementById('avg-revenue');
    if (totalEl) totalEl.innerText = String(totalLocations);
    if (avgEl) avgEl.innerText = totalLocations ? (totalScore / totalLocations).toFixed(4) : '0';

    updateLegendFromClusters(clusters);
}

// 6. Search UI (TomSelect) dựa trên lastAHPResponse
function extractLocationsForSearch(resp) {
    const out = [];
    const clusters = Array.isArray(resp?.clusters) ? resp.clusters : [];
    clusters.forEach(c => {
        (Array.isArray(c?.locations) ? c.locations : []).forEach(loc => {
            out.push({
                district: loc.district || '',
                ward: loc.ward || loc.phuong || '', // nếu backend sau có ward
                street: loc.street || '',
                lat: loc.lat,
                lng: loc.lng
            });
        });
    });
    return out;
}

function getUniqueStrings(items, key) {
    const set = new Set();
    items.forEach(it => {
        const v = (it[key] || '').trim();
        if (v) set.add(v);
    });
    return Array.from(set).sort();
}

function initSearchFromResponse(resp) {
    const items = extractLocationsForSearch(resp);
    const districts = getUniqueStrings(items, 'district');
    const wards = getUniqueStrings(items, 'ward');
    const streets = getUniqueStrings(items, 'street');

    // Quận
    window.searchQuan = new TomSelect('#search-quan', {
        options: districts.map(name => ({ id: name, name })),
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        placeholder: 'Chọn quận...',
        allowEmptyOption: true,
        onChange: async function (value) {
            currentFilters.district = value || '';
            currentFilters.ward = '';
            currentFilters.street = '';
            if (window.searchPhuong) window.searchPhuong.clear();
            if (window.searchDiaChi) window.searchDiaChi.clear();
            if (value) window.searchPhuong.enable(); else window.searchPhuong.disable();

            await refreshFromAPI();
        }
    });

    // Phường
    window.searchPhuong = new TomSelect('#search-phuong', {
        options: wards.map(name => ({ id: name, name })),
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        placeholder: 'Chọn phường...',
        allowEmptyOption: true,
        onChange: async function (value) {
            currentFilters.ward = value || '';
            currentFilters.street = '';
            if (window.searchDiaChi) window.searchDiaChi.clear();
            await refreshFromAPI();
        }
    });
    window.searchPhuong.disable();

    // Địa chỉ
    window.searchDiaChi = new TomSelect('#search-diachi', {
        options: streets.map(name => ({ id: name, name })),
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        placeholder: 'Chọn địa chỉ...',
        allowEmptyOption: true,
        onChange: async function (value) {
            currentFilters.street = value || '';
            await refreshFromAPI();
        }
    });
}

async function refreshFromAPI() {
    try {
        const resp = await fetchCalculateAHP();
        renderAHPResponse(resp);

        // Update options nhẹ theo response mới (rebuild options)
        const items = extractLocationsForSearch(resp);
        const districts = getUniqueStrings(items, 'district');
        const wards = getUniqueStrings(items, 'ward');
        const streets = getUniqueStrings(items, 'street');

        if (window.searchQuan) {
            window.searchQuan.clearOptions();
            window.searchQuan.addOption(districts.map(name => ({ id: name, name })));
            window.searchQuan.refreshOptions(false);
        }
        if (window.searchPhuong) {
            window.searchPhuong.clearOptions();
            window.searchPhuong.addOption(wards.map(name => ({ id: name, name })));
            window.searchPhuong.refreshOptions(false);
        }
        if (window.searchDiaChi) {
            window.searchDiaChi.clearOptions();
            window.searchDiaChi.addOption(streets.map(name => ({ id: name, name })));
            window.searchDiaChi.refreshOptions(false);
        }
    } catch (e) {
        console.error('calculate-ahp error:', e);
        showToast(`Lỗi tải dữ liệu bản đồ: ${e.message}`, 'error');
    }
}

// Load lần đầu
async function bootstrap() {
    // init criteria UI + default matrix
    renderCriteriaPairsUI();
    currentCriteriaMatrix = buildCriteriaMatrixFromUI();

    await loadFavoriteLocations();

    // apply button
    const applyBtn = document.getElementById('applyAHPBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            try {
                applyBtn.disabled = true;
                applyBtn.textContent = 'Đang áp dụng...';
                const newMatrix = buildCriteriaMatrixFromUI();
                currentCriteriaMatrix = newMatrix;

                // validate: cần có location đang chọn + baseline
                if (!oldCriteriaMatrix) {
                    oldCriteriaMatrix = newMatrix;
                }
                if (!selectedCriteriaScores) {
                    showToast('Bạn hãy click chọn 1 marker trước, rồi mới áp dụng tiêu chí để so sánh.', 'warning');
                    return;
                }

                // gọi compare-weights và hiển thị summary_html
                const compareResp = await callCompareWeights(newMatrix);
                showCompareResult(compareResp);

                // cập nhật baseline để lần sau so sánh từ "mới nhất"
                oldCriteriaMatrix = newMatrix;
            } finally {
                applyBtn.disabled = false;
                applyBtn.textContent = 'Áp dụng tiêu chí';
            }
        });
    }

    // Nếu chuyển từ index.html sang map.html: ưu tiên dùng dữ liệu đã lưu để render ngay
    let storedRequest = null;
    let storedResponse = null;
    try {
        const reqRaw = localStorage.getItem('ahp:lastRequest');
        const respRaw = localStorage.getItem('ahp:lastResponse');
        if (reqRaw) storedRequest = JSON.parse(reqRaw);
        if (respRaw) storedResponse = JSON.parse(respRaw);
    } catch (e) {
        // ignore parse errors
    }

    if (storedRequest?.criteriaMatrix) {
        currentCriteriaMatrix = storedRequest.criteriaMatrix;
    }
    if (storedRequest?.filters) {
        currentFilters.district = storedRequest.filters.district || '';
        currentFilters.ward = storedRequest.filters.ward || '';
        currentFilters.street = storedRequest.filters.street || '';
    }

    // IMPORTANT: baseline (old_criteriaMatrix) phải là ma trận đã dùng ban đầu,
    // không phải ma trận mặc định toàn 1 từ UI.
    if (currentCriteriaMatrix) {
        oldCriteriaMatrix = currentCriteriaMatrix;
        setCriteriaUIFromMatrix(currentCriteriaMatrix);
    }

    if (storedResponse?.clusters) {
        renderAHPResponse(storedResponse);
        initSearchFromResponse(storedResponse);
        // vẫn refresh lại 1 lần để đảm bảo dữ liệu mới nhất theo filter/matrix hiện tại
        await refreshFromAPI();
        return;
    }

    const resp = await fetchCalculateAHP();
    renderAHPResponse(resp);
    initSearchFromResponse(resp);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

// ============================================
// 6. MAPTILER SATELLITE VIEW (100% FREE)
// ============================================

let satelliteMap = null;
const MAPTILER_KEY = '3nRFtGdZX0hd7MAdFM0g';

// Mở Satellite View modal
function openStreetView(lat, lng, locationName) {
    const modal = document.getElementById('streetview-modal');
    const backdrop = document.getElementById('streetview-backdrop');
    const title = document.getElementById('streetview-title');

    // Hiển thị modal và backdrop
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');

    // Cập nhật title
    title.textContent = `Bản đồ vệ tinh 3D - ${locationName}`;

    // Khởi tạo Satellite Map
    initSatelliteMap(lat, lng);
}

// Đóng Satellite View modal
function closeStreetView() {
    const modal = document.getElementById('streetview-modal');
    const backdrop = document.getElementById('streetview-backdrop');

    modal.classList.add('hidden');
    backdrop.classList.add('hidden');

    // Xóa map để giải phóng bộ nhớ
    if (satelliteMap) {
        satelliteMap.remove();
        satelliteMap = null;
    }
}

// Khởi tạo MapLibre Satellite Map
function initSatelliteMap(lat, lng) {
    const container = document.getElementById('streetview-container');

    // Kiểm tra xem MapLibre đã load chưa
    if (typeof maplibregl === 'undefined') {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: #64748b;">
                <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
                <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px;">Lỗi tải thư viện bản đồ</div>
                <div style="font-size: 0.9rem;">Vui lòng kiểm tra kết nối internet và thử lại.</div>
            </div>
        `;
        return;
    }

    // Xóa map cũ nếu có
    if (satelliteMap) {
        satelliteMap.remove();
    }

    // Clear container
    container.innerHTML = '';

    try {
        // Tạo MapLibre map với Maptiler satellite tiles
        satelliteMap = new maplibregl.Map({
            container: 'streetview-container',
            style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
            center: [lng, lat],
            zoom: 19, // Zoom tối đa
            pitch: 30, // Giảm xuống 30 độ để rõ hơn
            bearing: 0,
            antialias: true,
            maxPitch: 85
        });

        // Thêm navigation controls
        satelliteMap.addControl(new maplibregl.NavigationControl({
            visualizePitch: true
        }), 'top-right');

        // Thêm fullscreen control
        satelliteMap.addControl(new maplibregl.FullscreenControl(), 'top-right');

        // Thêm scale control
        satelliteMap.addControl(new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
        }), 'bottom-left');

        // Thêm marker tại vị trí
        const marker = new maplibregl.Marker({
            color: '#ef4444'
        })
            .setLngLat([lng, lat])
            .addTo(satelliteMap);

        // Thêm popup cho marker
        const popup = new maplibregl.Popup({ offset: 25 })
            .setHTML(`<div style="font-weight: 600; color: #0f172a;">📍 Vị trí này</div>`);
        marker.setPopup(popup);

        // Enable 3D terrain khi map load xong
        satelliteMap.on('load', function () {
            // Thêm 3D terrain source
            satelliteMap.addSource('terrain', {
                type: 'raster-dem',
                url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
                tileSize: 256
            });

            // Set terrain
            satelliteMap.setTerrain({
                source: 'terrain',
                exaggeration: 1.5
            });

            // Thêm 3D buildings
            const layers = satelliteMap.getStyle().layers;
            const labelLayerId = layers.find(
                (layer) => layer.type === 'symbol' && layer.layout['text-field']
            )?.id;

            if (labelLayerId) {
                satelliteMap.addLayer({
                    'id': '3d-buildings',
                    'source': 'composite',
                    'source-layer': 'building',
                    'filter': ['==', 'extrude', 'true'],
                    'type': 'fill-extrusion',
                    'minzoom': 15,
                    'paint': {
                        'fill-extrusion-color': '#aaa',
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'height']
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height']
                        ],
                        'fill-extrusion-opacity': 0.6
                    }
                }, labelLayerId);
            }
        });

        // Xử lý lỗi
        satelliteMap.on('error', function (e) {
            console.error('MapLibre error:', e);
        });

    } catch (error) {
        console.error('Error initializing satellite map:', error);
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: #64748b;">
                <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
                <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px;">Không thể tải bản đồ</div>
                <div style="font-size: 0.9rem;">Vui lòng thử lại sau.</div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Đóng modal khi click vào nút close
    const closeBtn = document.getElementById('streetview-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeStreetView);
    }

    // Đóng modal khi click vào backdrop
    const backdrop = document.getElementById('streetview-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeStreetView);
    }

    // Đóng modal khi nhấn ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('streetview-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeStreetView();
            }
        }
    });
});

// Event delegation cho nút Satellite View (vì popup được tạo động)
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-streetview')) {
        e.preventDefault();
        const lat = parseFloat(e.target.getAttribute('data-lat'));
        const lng = parseFloat(e.target.getAttribute('data-lng'));
        const name = e.target.getAttribute('data-name');

        if (lat && lng) {
            openStreetView(lat, lng, name);
        }
    }

    // Compare: bấm trong popup -> đóng popup và chờ click marker khác
    if (e.target.classList.contains('btn-compare')) {
        e.preventDefault();
        const base = lastClicked || lastHovered;
        if (!base) {
            showToast('Bạn hãy hover/click 1 marker trước rồi bấm “So sánh”.', 'warning');
            return;
        }

        compareBase = base;
        waitingCompareTarget = true;
        setMapPickMode(true);

        // đóng popup hiện tại
        map.closePopup();

        // gợi ý cho user
        showLocationCompareMessage(`
            <div style="padding:10px; border:1px solid #e5e7eb; border-radius:10px; background:#fff;">
                <div style="font-weight:700; margin-bottom:6px;">So sánh địa điểm</div>
                <div style="color:#334155; font-size:13px;">Marker gốc: <b>${compareBase.label}</b></div>
                <div style="color:#64748b; font-size:12px; margin-top:4px;">Bây giờ hãy click 1 marker bất kỳ để so sánh.</div>
            </div>
        `);
    }

    if (e.target.classList.contains('btn-favorite')) {
        e.preventDefault();
        const btn = e.target;
        const locationId = Number(btn.getAttribute('data-location-id'));
        if (!locationId) return;

        let projectId = null;
        try {
            const reqRaw = localStorage.getItem('ahp:lastRequest');
            if (reqRaw) {
                const req = JSON.parse(reqRaw);
                projectId = req?.projectid ?? null;
            }
        } catch (_) {
            // ignore
        }

        if (!projectId) {
            showToast('Vui lòng chọn dự án trước khi thêm yêu thích.', 'warning');
            return;
        }

        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Đang xử lý...';

        fetch(API_BASE_URL + '/api/projects/favorite-locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                project_id: projectId,
                location_id: locationId
            })
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data.detail || 'Không thể cập nhật yêu thích.');
                }
                if (data.action === 'added') {
                    favoriteLocationIds.add(locationId);
                    btn.textContent = '❤️ Đã yêu thích';
                } else if (data.action === 'removed') {
                    favoriteLocationIds.delete(locationId);
                    btn.textContent = '❤️ Yêu thích';
                } else {
                    btn.textContent = originalText;
                }
            })
            .catch((err) => {
                console.error('Favorite error:', err);
                btn.textContent = originalText;
                showToast(err.message || 'Lỗi kết nối tới backend.', 'error');
            })
            .finally(() => {
                btn.disabled = false;
            });
    }
});

// Toggle Criteria Panel
window.showCriteriaPanel = function () {
    const panel = document.getElementById("criteriaPanel");
    if (panel) {
        panel.classList.remove("hidden");
        panel.style.display = "flex";
    }
};

window.closeCriteriaPanel = function () {
    const panel = document.getElementById("criteriaPanel");
    if (panel) {
        panel.classList.add("hidden");
        panel.style.display = "none";
    }
};

// Toggle Comparison Modal
window.openCompareModal = function () {
    const modal = document.getElementById("compareModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    }
};

window.closeCompareModal = function () {
    const modal = document.getElementById("compareModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }
};



