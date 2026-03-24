// Cần lấy URL API dùng chung
const API_BASE_URL = 'https://audrina-subultimate-ghostily.ngrok-free.dev';

async function apiFetch(path, options = {}) {
    const url = API_BASE_URL + path;
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`API error ${response.status} ${response.statusText}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

document.addEventListener("DOMContentLoaded", async () => {
    const criteriaRankingsContainer = document.getElementById("criteria-rankings-container");
    const summaryInfo = document.getElementById("summary-info");

    // Read payload from localStorage
    const lastRequestStr = localStorage.getItem("ahp:lastRequest");

    if (!lastRequestStr) {
        summaryInfo.innerHTML = "Không tìm thấy dữ liệu trọng số. Vui lòng quay lại Bước 1 để tính toán lại ma trận.";
        return;
    }

    try {
        summaryInfo.innerHTML = `<div class="ahp-loading" style="padding: 20px 0; color: #4f46e5; font-weight: 500;">⏳ Đang phân tích vị trí tốt nhất...</div>`;

        const requestData = JSON.parse(lastRequestStr);
        let payload = {};

        // Request từ dashboard (có criteriaMatrix) hoặc từ index (chỉ chứa weights và filters)
        if (requestData.weights) {
            payload = {
                weights: requestData.weights,
                filters: requestData.filters || {}
            };
        } else if (requestData.criteriaMatrix) {
            // Trường hợp user lấy từ Dashboard Project (có ma trận => cần gọi ưu tiên tính lại trước, nhưng endpoint /execute-final-analysis yêu cầu weights chứ k phải ma trận trực tiếp)
            // Ta chuyển đổi giản lược từ ma trận trọng số. Tuy nhiên app.js đã gọi /api/ahp/calculate/priority-vector-and-cr
            // Do đó Dashboard Project đang build sai payload cho map (sẽ được cập nhật sau nếu cần).
            // Tạm thời báo lỗi nhắc user nếu rớt vào luồng này
            summaryInfo.innerHTML = `<div style="color:red">Lỗi: Định dạng dữ liệu chưa tương thích với endpoint phân tích hiện tại (thiếu weights list). Vui lòng tính lại.</div>`;
            return;
        }

        // Fetch data
        const [data, evalData] = await Promise.all([
            apiFetch("/api/locations/execute-final-analysis", {
                method: "POST",
                body: JSON.stringify(payload)
            }),
            apiFetch("/api/locations/criteria-evaluation", {
                method: "POST",
                body: JSON.stringify(payload)
            }).catch(err => {
                console.error("Lỗi khi tải ma trận đánh giá:", err);
                return null;
            })
        ]);

        // Check data validity
        if (!data || (!data.success && !data.clusters)) {
            summaryInfo.innerHTML = "Dữ liệu phân tích không hợp lệ hoặc đã bị lỗi xử lý trên Server.";
            return;
        }

        const clusters = data.clusters || [];
        let allLocations = [];

        // Extract all locations from clusters
        clusters.forEach(cluster => {
            if (cluster.locations && cluster.locations.length > 0) {
                allLocations = allLocations.concat(cluster.locations);
            }
        });

        // Sort locations by AHP score descending
        allLocations.sort((a, b) => b.ahp_score - a.ahp_score);

        // Render summary
        const totalFound = data.summary?.total_locations_found || allLocations.length;
        summaryInfo.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap;">
        <div style="font-size: 24px;">🎯</div>
        <div style="flex: 1; min-width: 250px;">
          <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">Phân tích thành công! Trả về ${totalFound} địa điểm ưu tiên cao nhất</div>
          <div style="color: #64748b; font-size: 13px;">Danh sách dưới đây được sắp xếp theo mức độ phù hợp nhất dựa trên API trả về.</div>
        </div>
      </div>
    `;

        // Render criteria matrices
        const criteriaMatricesContainer = document.getElementById("criteria-matrices-container");
        if (evalData && evalData.success && evalData.tabs && evalData.tabs.length > 0) {
            let evalTabsHtml = `
              <div class="result-title" style="font-size: 18px; margin-bottom: 16px;">🏢 Ma trận Tỉ trọng Đánh giá Tiêu chí</div>
              <div class="ahp-tabs" style="margin-bottom: 16px;">
            `;
            let evalPanelsHtml = `<div class="ahp-criteria-content">`;

            evalData.tabs.forEach((tab, index) => {
                const isActive = index === 0 ? "active" : "";
                const tabId = `tab-eval-criteria-${index}`;

                evalTabsHtml += `
                    <button class="ahp-tab-btn ${isActive} eval-tab-btn" data-target="${tabId}">
                        ${tab.criteria_name}
                    </button>
                `;

                evalPanelsHtml += `
                <div class="ahp-tab-panel ${isActive} eval-tab-panel" id="${tabId}">
                  <div class="result-table-wrap">
                    <table class="result-table">
                      <thead>
                        <tr>
                          <th style="width: 20%;">Địa điểm</th>
                          ${tab.locations_header.map(loc => `<th style="text-align: center;" title="${loc.name}">${loc.name}</th>`).join("")}
                          <th style="color: #4f46e5; text-align: center; width: 15%;">Local Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${tab.matrix_rows.map((row, i) => `
                          <tr>
                            <td style="font-weight: 600; color: #334155;" title="${tab.locations_header[i].name}">${tab.locations_header[i].name}</td>
                            ${row.map(val => `<td style="text-align: center; font-family: monospace;">${val}</td>`).join("")}
                            <td style="font-weight: bold; color: #4f46e5; text-align: center;">${(tab.local_weights[i] * 100).toFixed(2)}%</td>
                          </tr>
                        `).join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
                `;
            });

            evalTabsHtml += `</div>`;
            evalPanelsHtml += `</div>`;

            if (criteriaMatricesContainer) {
                criteriaMatricesContainer.innerHTML = evalTabsHtml + evalPanelsHtml;

                const evalTabBtns = criteriaMatricesContainer.querySelectorAll('.eval-tab-btn');
                const evalTabPanels = criteriaMatricesContainer.querySelectorAll('.eval-tab-panel');

                evalTabBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        evalTabBtns.forEach(b => b.classList.remove('active'));
                        evalTabPanels.forEach(p => p.classList.remove('active'));

                        btn.classList.add('active');
                        const targetId = btn.getAttribute('data-target');
                        document.getElementById(targetId).classList.add('active');
                    });
                });
            }
        }

        // Render multiple criteria tables
        const criteriaAnalysis = data.summary?.criteria_analysis;

        if (!criteriaAnalysis || criteriaAnalysis.length === 0) {
            criteriaRankingsContainer.innerHTML = `<div style="text-align: center; padding: 40px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; color: #64748b;">Chưa có dữ liệu bảng xếp hạng tiêu chí từ hệ thống (hoặc backend chưa hỗ trợ).</div>`;
            return;
        }

        let tabsHtml = `<div class="ahp-tabs">`;
        let panelsHtml = ``;

        criteriaAnalysis.forEach((criteria, index) => {
            const isActive = index === 0 ? "active" : "";
            const tabId = `tab-criteria-${index}`;

            // 1. Build Tab Button
            tabsHtml += `
                <button class="ahp-tab-btn ${isActive}" data-target="${tabId}">
                    ${criteria.display_name}
                </button>
            `;

            // 2. Build Tab Panel
            panelsHtml += `
            <div class="ahp-tab-panel ${isActive}" id="${tabId}">
              <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🏆</span> 
                Top 10 địa điểm tốt nhất về: <span style="color: #4f46e5;">${criteria.display_name}</span>
              </div>
              <div class="result-table-wrap">
                  <table class="result-table">
                      <thead>
                          <tr>
                              <th width="15%" style="text-align: center;">Thứ hạng</th>
                              <th width="65%">Tên địa điểm / Khu vực</th>
                              <th width="20%">Điểm Tiêu chí</th>
                          </tr>
                      </thead>
                      <tbody>
            `;

            if (!criteria.top_locations || criteria.top_locations.length === 0) {
                panelsHtml += `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #64748b;">Chưa có dữ liệu địa điểm cho tiêu chí này.</td></tr>`;
            } else {
                criteria.top_locations.forEach((loc) => {
                    let rankColor = "#64748b";
                    let rankSize = "15px";
                    let rankIcon = "";
                    if (loc.rank === 1) { rankColor = "#eab308"; rankSize = "18px"; rankIcon = "🥇"; }
                    else if (loc.rank === 2) { rankColor = "#94a3b8"; rankSize = "17px"; rankIcon = "🥈"; }
                    else if (loc.rank === 3) { rankColor = "#b45309"; rankSize = "16px"; rankIcon = "🥉"; }

                    panelsHtml += `
                    <tr>
                      <td>
                          <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                              <strong style="color: ${rankColor}; font-size: ${rankSize};">${rankIcon || '#'} ${loc.rank}</strong>
                          </div>
                      </td>
                      <td>
                        <div class="location-name">${loc.name || "Chưa xác định"}</div>
                      </td>
                      <td>
                          <span class="score-value" style="font-size: 16px;">${(loc.score || 0).toFixed(2)}</span>
                      </td>
                    </tr>
                  `;
                });
            }

            panelsHtml += `
                      </tbody>
                  </table>
              </div>
            </div>
            `;
        });

        tabsHtml += `</div>`; // Đóng .ahp-tabs

        // Gắn vào DOM: Nút Tabs nằm trên, Panels nằm dưới
        criteriaRankingsContainer.innerHTML = tabsHtml + panelsHtml;

        // 3. Setup Events cho việc chuyển Tab
        const tabBtns = criteriaRankingsContainer.querySelectorAll('.ahp-tab-btn');
        const tabPanels = criteriaRankingsContainer.querySelectorAll('.ahp-tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Xóa active khỏi tất cả
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                // Thêm active vào nút được click
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });

    } catch (err) {
        console.error("Lỗi khi fetch API:", err);
        summaryInfo.innerHTML = `<div style="color:red">Đã xảy ra lỗi khi gọi dữ liệu phân tích từ Hệ thống. Vui lòng xem console log.</div>`;
    }
});
