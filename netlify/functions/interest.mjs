import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("event-interest");
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    let data = await store.get("all-events", { type: "json" });
    if (!data) data = {};

    if (req.method === "GET") {
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { eventId, userId, name, action } = body;

      if (!eventId || !userId) {
        return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers });
      }

      if (!data[eventId]) {
        data[eventId] = { named: {}, anon: [] };
      }

      delete data[eventId].named[userId];
      data[eventId].anon = data[eventId].anon.filter(id => id !== userId);

      if (action === "add") {
        if (name && name.trim()) {
          data[eventId].named[userId] = name.trim();
        } else {
          data[eventId].anon.push(userId);
        }
      }

      await store.setJSON("all-events", data);
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};
