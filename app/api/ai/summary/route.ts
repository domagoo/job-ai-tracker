// app/api/ai/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  applicationId: number;
  save?: boolean;
};

function asInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function extractOutputText(json: any): string {
  // Preferred: `output_text` shortcut (often present)
  if (typeof json?.output_text === "string" && json.output_text.trim()) {
    return json.output_text.trim();
  }

  // Common: output[0].content[].type === "output_text"
  const content = json?.output?.[0]?.content;
  if (Array.isArray(content)) {
    const chunk = content.find((c: any) => c?.type === "output_text" && typeof c?.text === "string");
    if (chunk?.text?.trim()) return chunk.text.trim();
  }

  // Fallback: scan all outputs for any output_text
  const outputs = json?.output;
  if (Array.isArray(outputs)) {
    for (const o of outputs) {
      const c = o?.content;
      if (!Array.isArray(c)) continue;
      for (const part of c) {
        if (part?.type === "output_text" && typeof part?.text === "string" && part.text.trim()) {
          return part.text.trim();
        }
      }
    }
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    const applicationId = asInt(body.applicationId);

    if (!applicationId) {
      return NextResponse.json({ error: "Invalid applicationId" }, { status: 400 });
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        company: true,
        role: true,
        status: true,
        location: true,
        jobUrl: true,
        createdAt: true,
        updatedAt: true,
        aiSummary: true,
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in env" }, { status: 500 });
    }

    // Keep it short + deterministic
    const prompt = `
You are helping a job seeker manage applications.
Write a concise professional summary for this application.

Rules:
- 2–4 sentences max.
- Mention role + company.
- Mention location if present.
- If job URL exists, say "Job link available" (do not print the URL).
- Mention current status.
- Do NOT invent details.
- Tone: confident, clear, recruiter-friendly.

Application:
Company: ${app.company}
Role: ${app.role}
Status: ${app.status}
Location: ${app.location ?? "Not set"}
Job URL: ${app.jobUrl ? "Provided" : "Not provided"}
Created: ${app.createdAt.toISOString()}
Updated: ${app.updatedAt.toISOString()}
`.trim();

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        // More correct for Responses API: pass messages
        input: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "OpenAI request failed",
          status: res.status,
          detail: json?.error?.message || JSON.stringify(json).slice(0, 500),
        },
        { status: 500 }
      );
    }

    const summary = extractOutputText(json);

    if (!summary) {
      return NextResponse.json(
        { error: "No summary generated", detail: JSON.stringify(json).slice(0, 500) },
        { status: 500 }
      );
    }

    if (body.save) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { aiSummary: summary },
      });
    }

    return NextResponse.json({ applicationId, summary, saved: !!body.save });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: e?.message ?? "Unknown" },
      { status: 500 }
    );
  }
}
