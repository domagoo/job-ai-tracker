// app/api/ai/review/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

type ReviewSections = {
  strengths: string[];
  risks: string[];
  nextSteps: string[];
  recruiterSummary: string; // 2–4 sentences
  tailoredPitch: string; // 2–4 sentences
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const applicationId = Number(body?.applicationId);

    if (!applicationId || Number.isNaN(applicationId)) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in environment variables." },
        { status: 500 }
      );
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
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const prompt = `
You are an expert recruiter + hiring manager for software roles.

Generate an "AI Application Review" for this job application.
Be practical, specific, and recruiter-friendly. No fluff.

APPLICATION:
- Company: ${app.company}
- Role: ${app.role}
- Status: ${app.status}
- Location: ${app.location ?? "N/A"}
- Job URL: ${app.jobUrl ?? "N/A"}

Return ONLY valid JSON with this exact shape:
{
  "strengths": string[],
  "risks": string[],
  "nextSteps": string[],
  "recruiterSummary": string,
  "tailoredPitch": string
}

Rules:
- recruiterSummary: 2–4 sentences, neutral + professional.
- tailoredPitch: 2–4 sentences, first-person, ready to paste in a message.
- strengths/risks/nextSteps: 3–6 bullets each, short.
`;

    // Responses API :contentReference[oaicite:1]{index=1}
    const response = await client.responses.create({
      // If this model name errors, change it to one you have access to.
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
      temperature: 0.4,
    });

    const text =
      response.output_text?.trim() ||
      "";

    const parsed = safeJsonParse<ReviewSections>(text);

    // If model returns non-JSON, fallback to a safe wrapper
    if (!parsed) {
      return NextResponse.json({
        application: app,
        reviewText: text || "No output generated.",
        sections: null,
      });
    }

    return NextResponse.json({
      application: app,
      reviewText: null,
      sections: parsed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "AI review failed" },
      { status: 500 }
    );
  }
}
