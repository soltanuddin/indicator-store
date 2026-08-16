const $ = (id) => document.getElementById(id);

// Mobile menu
const menu = $("menu");
const links = $("links");

if (menu && links) {
  menu.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
    });
  });
}


// Buy buttons
document.querySelectorAll(".choose").forEach((button) => {

  button.addEventListener("click", () => {

    const plan = button.dataset.plan;
    const planSelect = $("plan");
    const orderSection = $("order");

    if (planSelect) {
      planSelect.value = plan;
    }

    if (orderSection) {
      orderSection.scrollIntoView({
        behavior: "smooth"
      });
    }

  });

});


// Submit Order
const orderForm = $("orderForm");

if (orderForm) {

  orderForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const result = $("orderResult");

    const data = {
      name: $("name").value.trim(),
      email: $("email").value.trim(),
      tradingview_username: $("tv").value.trim(),
      plan: $("plan").value,
      payment_method: $("payment").value,
      transaction_id: $("trx").value.trim(),
      message: $("message").value.trim()
    };

    result.innerHTML = `
      <div class="result">
        Submitting order...
      </div>
    `;

    try {

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const text = await response.text();

      let json = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Server returned invalid response (HTTP ${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          json.error || `HTTP ${response.status}`
        );
      }

      result.innerHTML = `
        <div class="result">
          <b>Order submitted ✅</b><br><br>
          Order ID:
          <strong>${esc(json.order_id)}</strong>
          <br>
          Status:
          <strong>${esc(json.status || "Pending")}</strong>
        </div>
      `;

      orderForm.reset();

    } catch (error) {

      result.innerHTML = `
        <div class="result">
          <b>API Error ❌</b><br><br>
          ${esc(error.message)}
        </div>
      `;

    }

  });

}


// Order status
const statusForm = $("statusForm");

if (statusForm) {

  statusForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const result = $("statusResult");
    const orderId = $("lookup").value.trim();

    result.innerHTML = `
      <div class="result">
        Checking order...
      </div>
    `;

    try {

      const response = await fetch(
        "/api/orders/" + encodeURIComponent(orderId)
      );

      const text = await response.text();

      let json = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Server returned invalid response (HTTP ${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          json.error || `HTTP ${response.status}`
        );
      }

      result.innerHTML = `
        <div class="result">
          <b>Order Found ✅</b><br><br>
          Order ID:
          <strong>${esc(json.order_id)}</strong>
          <br>
          Plan:
          ${esc(json.plan)}
          <br>
          Status:
          <strong>${esc(json.status)}</strong>
        </div>
      `;

    } catch (error) {

      result.innerHTML = `
        <div class="result">
          <b>Order Error ❌</b><br><br>
          ${esc(error.message)}
        </div>
      `;

    }

  });

}


// HTML escape
function esc(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]
  );

}