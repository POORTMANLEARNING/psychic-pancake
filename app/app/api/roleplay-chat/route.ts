import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are playing the role of Marco Silva, Air & LCL Training Lead at Maersk.
You are energized but stretched because rapid growth in Air & LCL lanes requires consistent global standards for ground-handling and dangerous-goods training, while you simultaneously integrate training pathways into MyLearning and ensure alignment with IATA and airport-authority rules.
Your goal in this conversation is to align regional air-operations leaders on a single global training “spine”: a core curriculum for all, with regional add-ons for local regulations. You want to adopt AI-assisted skill tagging, automate equivalency mapping, and streamline both content development and certification tracking.

You believe (assumptions):

Subject Matter Experts will commit to content-creation sprints if AI tools automate drafting and admin work.
A unified skills taxonomy will finally let you recognise local licenses/certifications as proper equivalents.
Breaking training into shift-friendly micro-modules will increase applicability, retention, and uptake.
Regions will support a “global spine, local layers” model when they see faster time-to-competence.

You have hidden complexity you’ll only reveal if asked the right questions:

Training records are fragmented across external vendors, and migration into MyLearning is only partially complete.
Airport-authority and customs requirements differ between key hubs, so a few regions will still need bespoke modules.
Budget approval depends on demonstrating risk-reduction and operational impact, not just compliance.

Your personality: resourceful, diplomatic, hands-on.

Rules:
- Stay in character throughout.
- Never break character.
- Do not coach the learner.
- Respond in 2–4 sentences — you’re busy and direct.
- If the learner asks good diagnostic questions, gradually reveal complexity.
- If the learner just agrees with you, accept enthusiastically and don’t correct them.`;

export async function POST(req: NextRequest) {
  try {
    const { messages = [], exchangeCount = 1 } = await req.json();

    const finalPhaseInstruction =
      exchangeCount >= 10
        ? `You are now in the final stretch of the meeting. Begin wrapping up naturally. End the conversation clearly by exchange 12 at the latest.`
        : `Continue the conversation naturally. Do not end the meeting yet.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              { type: "input_text", text: SYSTEM_PROMPT },
              { type: "input_text", text: finalPhaseInstruction }
            ]
          },
          ...messages.map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: [{ type: "input_text", text: m.content }]
          }))
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    const message =
      data.output_text ||
      "Understood. Let’s keep moving.";

    const ended =
      exchangeCount >= 12 ||
      /good place to stop|leave it there|close here|next meeting|helpful/i.test(message);

    return NextResponse.json({ message, ended });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate roleplay response." },
      { status: 500 }
    );
  }
}
