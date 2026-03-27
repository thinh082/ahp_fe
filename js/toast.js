/**
 * showToast: Hiển thị thông báo dạng Toast mượt mà
 * @param {string} msg - Nội dung thông báo
 * @param {string} type - 'success', 'error', 'info', 'warning'
 */
function showToast(msg, type = 'info') {
  // Tìm hoặc tạo container chứa toast
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);

    // Style cơ bản cho container nếu chưa có trong CSS
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
  }

  // Tạo element toast
  const toast = document.createElement('div');
  toast.className = `ahp-toast ahp-toast-${type}`;
  
  // Icon dựa trên type
  let icon = 'info';
  if (type === 'success') icon = 'check_circle';
  if (type === 'error') icon = 'error';
  if (type === 'warning') icon = 'warning';

  toast.innerHTML = `
    <span class="material-symbols-outlined ahp-toast-icon">${icon}</span>
    <span class="ahp-toast-msg">${msg}</span>
    <button class="ahp-toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  // Thêm toast vào container
  container.appendChild(toast);

  // Tự động xóa sau 3.5 giây
  setTimeout(() => {
    toast.classList.add('ahp-toast-fadeout');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}
