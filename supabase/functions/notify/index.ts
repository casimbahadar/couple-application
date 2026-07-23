import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Called by an AFTER INSERT trigger (migration couple_app_email_notifications)
// whenever a partner posts. Emails the OTHER partner a *content-free* nudge —
// the intimate text stays in the app and the database, never in the email.
//
// Required Edge Function secrets (Dashboard → Edge Functions → Manage secrets):
//   NOTIFY_SECRET       — must match the value stored in Vault as `notify_secret`
//   GMAIL_USER          — the Gmail address used for SMTP
//   GMAIL_APP_PASSWORD  — a Google App Password (not the account password)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
Deno.serve(async (req) => {
  try {
    if (req.headers.get("x-notify-secret") !== Deno.env.get("NOTIFY_SECRET")) {
      return new Response("unauthorized", { status: 401 });
    }

    const { room_id, author_seat } = await req.json();
    if (!room_id || !author_seat) return new Response("bad request", { status: 400 });

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: members } = await supa
      .from("members")
      .select("user_id, seat, display_name, email_notifications")
      .eq("room_id", room_id);
    if (!members || members.length === 0) return new Response("ok");

    const sender = members.find((m) => m.seat === author_seat);
    const recipient = members.find((m) => m.seat !== author_seat);
    if (!recipient) return new Response("ok"); // partner hasn't joined yet
    if (recipient.email_notifications === false) return new Response("ok"); // opted out

    const { data: userRes } = await supa.auth.admin.getUserById(recipient.user_id);
    const to = userRes?.user?.email;
    if (!to) return new Response("ok");

    const { data: room } = await supa.from("rooms").select("name").eq("id", room_id).single();
    const appName = (room?.name && room.name.trim()) || "your shared space";
    const senderName = (sender?.display_name && sender.display_name.trim()) || "Your partner";

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get("GMAIL_USER")!,
          password: Deno.env.get("GMAIL_APP_PASSWORD")!,
        },
      },
    });
    await client.send({
      from: Deno.env.get("GMAIL_USER")!,
      to,
      subject: `${senderName} left something in ${appName}`,
      content:
        `${senderName} left something for you in ${appName}.\n\n` +
        `Open the app when you're ready — the words are waiting there, not in this email.\n\n` +
        `— To stop these, turn off email notifications in the app's settings.`,
    });
    await client.close();
    return new Response("ok");
  } catch (e) {
    console.error("notify error", e);
    return new Response("error", { status: 500 });
  }
});
