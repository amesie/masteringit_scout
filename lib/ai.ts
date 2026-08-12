// Single AI provider abstraction. Every AI call in SCOUT goes through
// generateContent() — no other file should reference the underlying
// provider by name.
//
// Now (demo): calls the Gemini API using the `scout_gemini_api` env var
// (that's the actual name Vercel has for this key — see scout_build_spec.md
// §2, it does not match the `GEMINI_API_KEY` name the spec guessed).
//
// Later (deployment): swap the body of this function to call the Claude API
// (model "claude-haiku-4-5") using an `ANTHROPIC_API_KEY` env var instead.
// Callers only see generateContent(prompt, systemInstructions) => string,
// so nothing else in the codebase needs to change.

const GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export async function generateContent(prompt: string, systemInstructions?: string): Promise<string> {
  const apiKey = process.env.scout_gemini_api

  if (!apiKey) {
    throw new Error("Missing scout_gemini_api environment variable — required for AI calls.")
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...(systemInstructions
        ? { systemInstruction: { role: "system", parts: [{ text: systemInstructions }] } }
        : {}),
      generationConfig: { temperature: 0.2 },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`AI provider request failed (${res.status}): ${errText}`)
  }

  const data = await res.json()
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""

  if (!text.trim()) {
    throw new Error("AI provider returned an empty response.")
  }

  return text
}
