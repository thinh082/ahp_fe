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
    const tbody = document.getElementById("result-tbody");
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
        const data = await apiFetch("/api/locations/execute-final-analysis", {
            method: "POST",
            body: JSON.stringify(payload)
        });

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
      <div style="display: flex; gap: 12px; align-items: center;">
        <div style="font-size: 24px;">🎯</div>
        <div>
          <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">Phân tích thành công! Trả về ${totalFound} địa điểm ưu tiên cao nhất</div>
          <div style="color: #64748b; font-size: 13px;">Danh sách dưới đây được sắp xếp theo mức độ phù hợp nhất dựa trên API trả về.</div>
        </div>
      </div>
    `;

        // Render table
        if (allLocations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #64748b;">Không có địa điểm nào phù hợp với đánh giá này.</td></tr>`;
            return;
        }

        let html = "";
        allLocations.forEach((loc, index) => {
            // Determine rating style
            let ratingClass = "rating-medium";
            let ratingText = loc.rating || "CÂN NHẮC";
            let ratingIcon = "⚖️";

            if (ratingText === "NÊN MỞ") {
                ratingClass = "rating-good";
                ratingIcon = "✅";
            } else if (ratingText === "KHÔNG NÊN") {
                ratingClass = "rating-bad";
                ratingIcon = "🚫";
            }

            // Render criteria scores
            let criteriaHtml = "";
            if (loc.criteria_scores) {
                const cNames = {
                    "C1_revenue_potential": "Doanh thu",
                    "C2_accessibility": "Tiếp cận",
                    "C3_cost": "Chi phí rẻ",
                    "C4_competition": "Ít cạnh tranh",
                    "C5_risk_stability": "Độ ổn định"
                };

                for (const [key, val] of Object.entries(loc.criteria_scores)) {
                    const shortName = cNames[key] || key;
                    criteriaHtml += `<span class="criteria-score-item">${shortName}: <strong>${val.toFixed(2)}</strong></span>`;
                }
            }

            let rankColor = "#64748b";
            let rankSize = "15px";
            if (index === 0) { rankColor = "#eab308"; rankSize = "20px"; }
            else if (index === 1) { rankColor = "#94a3b8"; rankSize = "18px"; }
            else if (index === 2) { rankColor = "#b45309"; rankSize = "16px"; }

            html += `
        <tr>
          <td><strong style="color: ${rankColor}; font-size: ${rankSize}; display: block; text-align: center;">#${index + 1}</strong></td>
          <td>
            <div class="location-name">${loc.street || "Đường chưa xác định"}</div>
            <div class="location-address">${loc.district || "Quận chưa xác định"}</div>
          </td>
          <td><span class="score-value">${(loc.ahp_score || 0).toFixed(2)}</span></td>
          <td><span class="rating-badge ${ratingClass}">${ratingIcon} ${ratingText}</span></td>
          <td><div class="criteria-scores">${criteriaHtml}</div></td>
        </tr>
      `;
        });

        tbody.innerHTML = html;

    } catch (err) {
        console.error("Lỗi khi fetch API:", err);
        summaryInfo.innerHTML = `<div style="color:red">Đã xảy ra lỗi khi gọi dữ liệu phân tích từ Hệ thống. Vui lòng xem console log.</div>`;
    }
});
