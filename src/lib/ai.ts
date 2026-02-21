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

export async function getBuilderChatResponse(
  projectContext: string,
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "model"; content: string }>
): Promise<{
  reply: string;
  intent: string;
  business_update: {
    progress_delta: number;
    traction_signal: string | null;
    valuation_adjustment: "up" | "down" | "none";
  };
}> {
  const systemPrompt = `You are Vamo, an AI co-pilot for startup founders.
${projectContext}

Your job:
1. Respond helpfully to their update or question (keep it concise, 2-3 sentences max).
2. Extract the intent of their message. Classify as one of: feature, customer, revenue, ask, general.
3. If the update implies progress (shipped something, talked to users, made revenue), generate an updated business analysis.
4. Return your response as JSON:
{
  "reply": "Your response text",
  "intent": "feature|customer|revenue|ask|general",
  "business_update": {
    "progress_delta": 0-5,
    "traction_signal": "string or null",
    "valuation_adjustment": "up|down|none"
  }
}

Respond with ONLY valid JSON, no markdown formatting.`;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const chatHistory = conversationHistory.map((msg) => ({
    role: msg.role as "user" | "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: chatHistory,
  });

  const result = await chat.sendMessage(userMessage);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text);
    return {
      reply: parsed.reply || "I couldn't process that right now. Your update has been saved.",
      intent: parsed.intent || "general",
      business_update: {
        progress_delta: parsed.business_update?.progress_delta || 0,
        traction_signal: parsed.business_update?.traction_signal || null,
        valuation_adjustment: parsed.business_update?.valuation_adjustment || "none",
      },
    };
  } catch (err) {
    console.error("Failed to parse AI JSON response", err);
    return {
      reply: "I couldn't process that right now. Your update has been saved.",
      intent: "general",
      business_update: {
        progress_delta: 0,
        traction_signal: null,
        valuation_adjustment: "none",
      },
    };
  }
}

export async function getValuationOffer(
  projectName: string,
  projectDescription: string | null,
  activitySummary: string
): Promise<{
  low_range: number;
  high_range: number;
  reasoning: string;
  signals: string[];
}> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a startup valuation engine. Based on the following project data and activity, provide a non-binding offer range and explanation.

Project: ${projectName}
Description: ${projectDescription || "No description provided"}
Activity Summary:
${activitySummary}

Expected response must be valid JSON matching this schema exactly:
{
  "low_range": number,
  "high_range": number,
  "reasoning": "string explaining the offer (2-3 sentences)",
  "signals": ["list", "of", "signals"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return {
      low_range: parsed.low_range ?? 1000,
      high_range: parsed.high_range ?? 5000,
      reasoning: parsed.reasoning ?? "Valuation based on early-stage indicators.",
      signals: parsed.signals ?? [],
    };
  } catch {
    // Fallback if AI response isn't valid JSON
    return {
      low_range: 1000,
      high_range: 5000,
      reasoning: "Early-stage project with growth potential. Valuation based on activity level.",
      signals: ["activity_metrics"],
    };
  }
}

export async function getListingDescription(
  projectName: string,
  projectDescription: string | null,
  metrics: {
    progress: number;
    prompts: number;
    traction: number;
  },
  whyBuilt: string | null
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a professional copywriter for a startup marketplace. Write a compelling, high-converting listing description for the following project.
  
  Project Name: ${projectName}
  Current Description: ${projectDescription || "N/A"}
  Why Built: ${whyBuilt || "N/A"}
  
  Key Metrics:
  - Development Progress: ${metrics.progress}%
  - Founder Engagement (Prompts): ${metrics.prompts}
  - Traction Signals: ${metrics.traction}
  
  The description should be 2-3 paragraphs. 
  - Paragraph 1: Hook the buyer with the value proposition and current status.
  - Paragraph 2: Highlight the traction and development effort (using the metrics as proof of work).
  - Paragraph 3: Explain the potential for the buyer (e.g., "Perfect for someone looking to jumpstart a X business").
  
  Tone: Professional, exciting, investment-oriented.
  Format: Plain text, no markdown headers.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Generation Error:", error);
    return projectDescription || "A promising startup project built with Vamo.";
  }
}
