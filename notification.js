// notification.js
document.addEventListener("DOMContentLoaded", function () {
  const notification = document.createElement("div");
  notification.classList.add("notification-container");

  notification.innerHTML = `
    <strong>ℹ️ Multi Sender V1 Info</strong>
    <p>Supports only <b>less than 200 addresses</b> per transaction. If your TX fails, try reducing addresses.</p>
    <span class="notification-close">&times;</span>
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add("notification-show"), 500);

  document.querySelector(".notification-close").addEventListener("click", () => {
    notification.classList.remove("notification-show");
    setTimeout(() => notification.remove(), 300);
  });
});
