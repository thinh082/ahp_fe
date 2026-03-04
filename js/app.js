
const criteria = [
  "Tiềm năng doanh thu",
  "Tiếp cận & vị trí",
  "Chi phí",
  "Cạnh tranh",
  "Ổn định",
];

// Phân loại loại tiêu chí: 'good' = càng cao càng tốt, 'bad' = càng thấp càng tốt
const criteriaTypes = {
  "Tiềm năng doanh thu": "good",
  "Tiếp cận & vị trí": "good",
  "Chi phí": "bad",
  "Cạnh tranh": "bad",
  "Ổn định": "bad",
};

const listEl = document.getElementById("criteriaList");
const pairs = [];

for (let i = 0; i < criteria.length; i++) {
  for (let j = i + 1; j < criteria.length; j++) {
    // Lưu thêm index i, j để dựng ma trận tiêu chí
    pairs.push({ a: criteria[i], b: criteria[j], value: 1, i, j });
  }
}

function createRow(pair, idx) {
  const row = document.createElement("div");
  row.className = "c-row";

  const left = document.createElement("div");
  left.className = "c-left";
  left.textContent = pair.a;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "9";
  slider.step = "1";
  slider.value = String(pair.value);

  // Xác định loại tiêu chí để visual feedback
  const typeA = criteriaTypes[pair.a];
  slider.setAttribute("data-criteria-type", typeA);
  slider.setAttribute("data-value", slider.value);

  const score = document.createElement("div");
  score.className = "c-score";
  score.textContent = slider.value;

  const right = document.createElement("div");
  right.className = "c-right";
  right.textContent = pair.b;

  slider.addEventListener("input", () => {
    score.textContent = slider.value;
    pairs[idx].value = Number(slider.value);
    slider.setAttribute("data-value", slider.value);
  });

  row.append(left, slider, score, right);
  return row;
}

function renderPairs() {
  if (!listEl) return;
  listEl.innerHTML = "";
  pairs.forEach((p, idx) => listEl.appendChild(createRow(p, idx)));
}

renderPairs();

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

// Hàm xây dựng ma trận tiêu chí từ pairs
function buildCriteriaMatrix() {
  // TODO(tam-thoi): Set c?ng ma tr?n theo y�u c?u t?m th?i.
  // Khi ho�n t?t, b? comment do?n t?o ma tr?n t? pairs b�n du?i.
  const criteriaMatrix = [
    [1, 3, 2, 4, 3],
    [0.33, 1, 0.5, 2, 2],
    [0.5, 2, 1, 3, 2],
    [0.25, 0.5, 0.33, 1, 1],
    [0.33, 0.5, 0.5, 1, 1],
  ];

  return criteriaMatrix;

  // const n = criteria.length;
  // const round2 = (x) => Math.round(x * 100) / 100;
  //
  // // Kh?i t?o ma tr?n n x n v?i du?ng ch�o = 1
  // const criteriaMatrix = Array.from({ length: n }, () =>
  //   Array.from({ length: n }, (_, j) => 1)
  // );
  //
  // // Duy?t qua t?t c? c�c c?p v� g�n v�o ma tr?n
  // pairs.forEach((p) => {
  //   const i = p.i;
  //   const j = p.j;
  //   const v = Number(p.value) || 1;
  //
  //   // a_ij = v, a_ji = 1/v
  //   criteriaMatrix[i][j] = round2(v);
  //   criteriaMatrix[j][i] = v === 0 ? 0 : round2(1 / v);
  // });
  //
  // return criteriaMatrix;
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

// Hàm gọi API tính toán AHP
async function callCalculateAHP(criteriaMatrix, filters) {
  try {
    const requestBody = {
      criteriaMatrix: criteriaMatrix,
      filters: filters
    };

    console.log("Gửi request đến API:", requestBody);

    const response = await apiFetch("/api/locations/calculate-ahp", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    return response;
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    throw error;
  }
}

if (calcBtn) {
  calcBtn.addEventListener("click", async () => {
    try {
      // Xây dựng ma trận tiêu chí
      const criteriaMatrix = buildCriteriaMatrix();

      // Lấy filters
      const filters = getFilters();

      console.log("Ma trận tiêu chí:", criteriaMatrix);
      console.log("Filters:", filters);

      // Gọi API
      calcBtn.disabled = true;
      calcBtn.textContent = "Đang tính toán...";

      const result = await callCalculateAHP(criteriaMatrix, filters);

      console.log("Kết quả từ API:", result);

      // Lưu request/response để map.html render ngay
      try {
        const payload = {
          criteriaMatrix,
          filters,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("ahp:lastRequest", JSON.stringify(payload));
        localStorage.setItem("ahp:lastResponse", JSON.stringify(result));
      } catch (storageErr) {
        console.warn("Không thể lưu localStorage (bỏ qua):", storageErr);
      }

      // Chuyển sang trang bản đồ
      window.location.href = "map.html";

    } catch (error) {
      alert("❌ Lỗi khi tính toán: " + error.message);
      console.error("Chi tiết lỗi:", error);
    } finally {
      calcBtn.disabled = false;
      calcBtn.textContent = "Tính điểm tiêu chí";
    }
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
    const REDIRECT_URI = "https://thinh082.github.io/ahp_fe/google-callback.html";
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
    ...(sodienthoai ? { sodienthoai } : {}),
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
