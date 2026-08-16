export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Create order
    if (url.pathname === "/api/orders" && request.method === "POST") {
      try {
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
          if (!data[field] || !String(data[field]).trim()) {
            return Response.json(
              { error: `${field} is required` },
              { status: 400 }
            );
          }
        }

        const orderId =
          "IS-" +
          Date.now().toString(36).toUpperCase() +
          Math.random().toString(36).slice(2, 6).toUpperCase();

        const createdAt = new Date().toISOString();

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
        `)
          .bind(
            orderId,
            String(data.name).trim(),
            String(data.email).trim(),
            String(data.tradingview_username).trim(),
            String(data.plan).trim(),
            String(data.payment_method).trim(),
            String(data.transaction_id).trim(),
            String(data.message || "").trim(),
            "Pending",
            createdAt
          )
          .run();

        return Response.json({
          success: true,
          order_id: orderId,
          status: "Pending"
        });

      } catch (error) {
        return Response.json(
          {
            error: error.message || "Database error"
          },
          { status: 500 }
        );
      }
    }

    // Check order
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
        `)
          .bind(orderId)
          .first();

        if (!order) {
          return Response.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        return Response.json(order);

      } catch (error) {
        return Response.json(
          {
            error: error.message || "Database error"
          },
          { status: 500 }
        );
      }
    }

    // Website
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};