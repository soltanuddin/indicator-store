export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: Create Order
    if (url.pathname === "/api/orders" && request.method === "POST") {
      try {
        const data = await request.json();

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

        return new Response(
          JSON.stringify({
            success: true,
            order_id: orderId,
            status: "Pending"
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    }

    // API: Check Order
    if (
      url.pathname.startsWith("/api/orders/") &&
      request.method === "GET"
    ) {
      try {
        const orderId = decodeURIComponent(
          url.pathname.split("/").pop()
        );

        const order = await env.DB.prepare(`
          SELECT order_id, plan, status, created_at
          FROM orders
          WHERE order_id = ?
          LIMIT 1
        `).bind(orderId).first();

        if (!order) {
          return new Response(
            JSON.stringify({
              error: "Order not found"
            }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        }

        return new Response(
          JSON.stringify(order),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    }

    // Website
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", {
      status: 404
    });
  }
};