import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client (free tier)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getChatResponse(
  projectContext: string,
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "model"; content: string }>
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemPrompt = `You are Vamo, a friendly AI assistant for startup founders building their projects. 
You help founders iterate on their startup UI and business progress.

Here is the project context:
${projectContext}

Guidelines:
- Be encouraging and supportive
- Give actionable advice
- When users share links or updates, acknowledge them and award pineapples
- Suggest next steps using the available categories: Profile, Vibecoding Activity, Collaborators
- Keep responses concise but helpful
- Use emoji naturally
- When a user adds information (URL, description, etc.), celebrate it and mention the pineapple reward`;

  const chatHistory = conversationHistory.map((msg) => ({
    role: msg.role as "user" | "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: "System: " + systemPrompt }] },
      { role: "model", parts: [{ text: "Understood! I'm Vamo, ready to help founders build amazing startups." }] },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(userMessage);
  const response = result.response;
  return response.text();
}

export async function getValuationOffer(
  projectName: string,
  projectDescription: string | null,
  activityCount: number,
  evidenceCount: number,
  hasUrl: boolean
): Promise<{
  lowRange: number;
  highRange: number;
  reasoning: string;
  signals: Record<string, unknown>;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a startup valuation analyst. Based on the following project information, provide a valuation estimate.

Project: ${projectName}
Description: ${projectDescription || "No description provided"}
Activity Count: ${activityCount} events logged
Evidence Count: ${evidenceCount} evidence items
Has Project URL: ${hasUrl ? "Yes" : "No"}

Provide a JSON response with:
- lowRange: minimum valuation in USD (integer)
- highRange: maximum valuation in USD (integer)  
- reasoning: brief explanation of the valuation (2-3 sentences)
- signals: object with key traction signals and their assessment

Respond with ONLY valid JSON, no markdown formatting.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return {
      lowRange: parsed.lowRange ?? 1000,
      highRange: parsed.highRange ?? 5000,
      reasoning: parsed.reasoning ?? "Valuation based on early-stage indicators.",
      signals: parsed.signals ?? {},
    };
  } catch {
    // Fallback if AI response isn't valid JSON
    return {
      lowRange: 1000,
      highRange: 5000,
      reasoning: "Early-stage project with growth potential. Valuation based on activity level and evidence collected.",
      signals: { activity: activityCount, evidence: evidenceCount, hasUrl },
    };
  }
}
