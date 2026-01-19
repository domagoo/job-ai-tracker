import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { applicationId, save } = await req.json();

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
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

    const json = await res.json();

    const text =
      json?.output?.[0]?.content?.find((c: any) => c.type === "output_text")?.text ??
      "";

    if (!text) {
      return NextResponse.json({ error: "No output generated" }, { status: 500 });
    }

    // Simple parsing
    const [subjectLine, ...bodyLines] = text.split("\n").filter(Boolean);
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
      saved: !!save,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: e.message },
      { status: 500 }
    );
  }
}
