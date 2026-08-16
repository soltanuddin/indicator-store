function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function isAdmin(request, env) {
  const key = request.headers.get("X-Admin-Key");
  return Boolean(env.ADMIN_KEY && key && key === env.ADMIN_KEY);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // CREATE ORDER
    // =========================
    if (url.pathname === "/api/orders" && request.method === "POST") {
      try {
        if (!env.DB) {
          return json({ error: "DB binding not found" }, 500);
        }

        const data = await request.json();

        const required = [
          "name",
          "email",
          "tradingview_username",
          "plan",
          "payment_method",
          "transaction_id"
        ];

        for (const field of required) {
          if (!data[field]) {
            return json({
              error: `${field} is required`
            }, 400);
          }
        }

        const orderId =
          "IS-" +
          Date.now().toString(36).toUpperCase() +
          Math.random().toString(36).slice(2, 7).toUpperCase();

        await env.DB.prepare(`
          INSERT INTO orders (
            order_id,
            name,
            email,
            tradingview_username,
            plan,
            payment_method,
            transaction_id,
            message,
            status,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          orderId,
          data.name,
          data.email,
          data.tradingview_username,
          data.plan,
          data.payment_method,
          data.transaction_id,
          data.message || "",
          "Pending",
          new Date().toISOString()
        ).run();

        return json({
          success: true,
          order_id: orderId,
          status: "Pending"
        });

      } catch (error) {
        return json({
          error: error.message
        }, 500);
      }
    }

    // =========================
    // CUSTOMER ORDER STATUS
    // =========================
    if (
      url.pathname.startsWith("/api/orders/") &&
      request.method === "GET"
    ) {
      try {
        if (!env.DB) {
          return json({
            error: "DB binding not found"
          }, 500);
        }

        const orderId = decodeURIComponent(
          url.pathname.slice("/api/orders/".length)
        );

        const order = await env.DB.prepare(`
          SELECT order_id, plan, status, created_at
          FROM orders
          WHERE order_id = ?
          LIMIT 1
        `).bind(orderId).first();

        if (!order) {
          return json({
            error: "Order not found"
          }, 404);
        }

        return json(order);

      } catch (error) {
        return json({
          error: error.message
        }, 500);
      }
    }

    // =========================
    // ADMIN: LIST ORDERS
    // =========================
    if (
      url.pathname === "/api/admin/orders" &&
      request.method === "GET"
    ) {
      if (!isAdmin(request, env)) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      try {
        if (!env.DB) {
          return json({
            error: "DB binding not found"
          }, 500);
        }

        const result = await env.DB.prepare(`
          SELECT
            id,
            order_id,
            name,
            email,
            tradingview_username,
            plan,
            payment_method,
            transaction_id,
            message,
            status,
            created_at
          FROM orders
          ORDER BY id DESC
        `).all();

        return json({
          success: true,
          orders: result.results || []
        });

      } catch (error) {
        return json({
          error: error.message
        }, 500);
      }
    }

    // =========================
    // ADMIN: UPDATE STATUS
    // =========================
    if (
      url.pathname.startsWith("/api/admin/orders/") &&
      request.method === "PATCH"
    ) {
      if (!isAdmin(request, env)) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      try {
        if (!env.DB) {
          return json({
            error: "DB binding not found"
          }, 500);
        }

        const orderId = decodeURIComponent(
          url.pathname.slice("/api/admin/orders/".length)
        );

        const data = await request.json();

        const allowedStatuses = [
          "Pending",
          "Payment Verified",
          "Activated",
          "Completed"
        ];

        if (!allowedStatuses.includes(data.status)) {
          return json({
            error: "Invalid status"
          }, 400);
        }

        const result = await env.DB.prepare(`
          UPDATE orders
          SET status = ?
          WHERE order_id = ?
        `).bind(
          data.status,
          orderId
        ).run();

        if (!result.meta || result.meta.changes === 0) {
          return json({
            error: "Order not found"
          }, 404);
        }

        return json({
          success: true,
          order_id: orderId,
          status: data.status
        });

      } catch (error) {
        return json({
          error: error.message
        }, 500);
      }
    }

    // =========================
    // API TEST
    // =========================
    if (
      url.pathname === "/api/orders" &&
      request.method === "GET"
    ) {
      return json({
        success: true,
        api: "orders",
        message: "API is working"
      });
    }

    // =========================
    // WEBSITE
    // =========================
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", {
      status: 404
    });
  }
};