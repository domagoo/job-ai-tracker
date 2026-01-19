import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { applicationId, save } = await req.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: "Missing applicationId" },
        { status: 400 }
      );
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const prompt = `
Write a professional follow-up email for a job application.

Rules:
- Polite, concise, recruiter-friendly
- 1 short subject line
- 1 short email body
- Mention company and role
- If status is INTERVIEW, thank interviewer
- Do not invent names or dates

Company: ${app.company}
Role: ${app.role}
Status: ${app.status}
`.trim();

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", errText);
      return NextResponse.json(
        { error: "OpenAI request failed", detail: errText },
        { status: 500 }
      );
    }

    const json = await res.json();

    // Robust extraction for Responses API
    const text: string =
      json?.output_text ??
      json?.output
        ?.flatMap((o: any) => o?.content ?? [])
        ?.filter(
          (c: any) => c?.type === "output_text" && typeof c.text === "string"
        )
        ?.map((c: any) => c.text)
        ?.join("\n") ??
      "";

    if (!text.trim()) {
      console.error("OPENAI RESPONSE HAD NO TEXT:", json);
      return NextResponse.json(
        { error: "No output generated" },
        { status: 500 }
      );
    }

    // Simple parsing
    const lines = text
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    const subjectLine = lines[0] ?? "";
    const bodyLines = lines.slice(1);

    const subject = subjectLine.replace(/^Subject:\s*/i, "");
    const body = bodyLines.join("\n").trim();

    if (save) {
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          followUpEmailSubject: subject,
          followUpEmailBody: body,
        },
      });
    }

    return NextResponse.json({
      subject,
      body,
      saved: Boolean(save),
    });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Unknown server error";

    console.error("FOLLOWUP ROUTE ERROR:", message);

    return NextResponse.json(
      { error: "Server error", detail: message },
      { status: 500 }
    );
  }
}
