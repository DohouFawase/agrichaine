import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendWaitlistConfirmation } from "@/lib/waitlist-email";

const allowedRoles = new Set(["producteur", "acheteur", "transporteur", "indecis"]);
const allowedLocales = new Set(["fr", "en", "es"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body.role === "string" ? body.role : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const locale = typeof body.locale === "string" ? body.locale : "fr";
    const waitlistLimit = Number(process.env.WAITLIST_LIMIT ?? 100);

    if (!name || !email || !city || !allowedRoles.has(role) || !allowedLocales.has(locale)) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("join_waitlist", {
      p_name: name,
      p_email: email,
      p_role: role,
      p_city: city,
      p_locale: locale,
      p_limit: waitlistLimit,
    });

    if (error?.message.includes("WAITLIST_FULL")) {
      return NextResponse.json({ error: "WAITLIST_FULL" }, { status: 409 });
    }

    if (error) {
      console.error("Supabase waitlist insert failed", error);
      return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    }

    const signup = data?.[0] as
      | { position: number; referral_code: string; created: boolean }
      | undefined;

    if (!signup) {
      return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    }

    if (!signup.created) {
      return NextResponse.json({ error: "ALREADY_REGISTERED" }, { status: 409 });
    }

    const emailSent = await sendWaitlistConfirmation({
      email,
      name,
      locale,
      position: signup.position,
      referralCode: signup.referral_code,
    });

    return NextResponse.json({
      success: true,
      position: signup.position,
      referralCode: signup.referral_code,
      emailSent,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Supabase environment variables are missing") {
      console.error(error.message);
      return NextResponse.json({ error: "SERVER_NOT_CONFIGURED" }, { status: 503 });
    }

    console.error("Waitlist request failed", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
