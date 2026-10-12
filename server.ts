import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));
const server = http.createServer(app);
const PORT = 3000;

// Lazy initialization of Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your Secrets in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Free Fire MAX Custom Gaming Alerts Endpoint
app.get("/api/freefire-alerts", (req, res) => {
  res.json([
    {
      id: "alert-zone",
      title: "Red Zone Shrinking!",
      type: "zone",
      message: "Red Zone incoming! Loot chhod aur bhaag na, noob! *giggles*",
      tauntOdia: "ଆରେ Red Zone ଆସିଗଲା! ଲୁଟ୍ ଛାଡି ଶୀଘ୍ର ପଳା, ନହେଲେ finish ହେଇଯିବୁ! ହିହି!",
      icon: "🚨"
    },
    {
      id: "alert-airdrop",
      title: "Level 3 Airdrop Incoming!",
      type: "airdrop",
      message: "Airdrop drop hua hai! Level 3 vest milgaya kya ya camper ki tarah baithe ho? *laughs*",
      tauntOdia: "Airdrop ପଡ଼ିଲାଣି! Level 3 ଲୁଟ୍ କରିବୁ ନା ଘରେ ଲୁଚିକି ବସିବୁ? ହାହା!",
      icon: "📦"
    },
    {
      id: "alert-rush",
      title: "Enemy Squad Rush Alert!",
      type: "rush",
      message: "Squad rush kar rahi hai! Headshot rate dikha apna, ya fir gloo wall lagake bhaag jayega? *giggles*",
      tauntOdia: "Enemy Squad rush କଲେଣି! Headshot ଦେବୁ ନା Gloo wall ପକେଇ ପଳେଇବୁ? ହିହି!",
      icon: "⚔️"
    },
    {
      id: "alert-booyah",
      title: "BOOYAH! Victory Challenge",
      type: "booyah",
      message: "BOOYAH! Okay okay, maybe your aim isn't so bad today na! But 1v1 me in custom room next! *laughs*",
      tauntOdia: "ବାଃ BOOYAH କଲୁ! ଆଜି ତୋ aim ଟିକେ ଭଲ ଅଛି! କିନ୍ତୁ next match ମୋ ସହ 1v1 ହଉ! ହିହି!",
      icon: "👑"
    }
  ]);
});

// Built-in AI Creative Tools: Real-time Image & Short-Video Generation
app.post("/api/generate-creative", async (req, res) => {
  try {
    const { prompt, type, style = "freefire-cyber" } = req.body;
    const ai = getAiClient();

    if (type === "image") {
      // Generate creative image prompt and stylized graphic representation
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create a vivid, high-tech SVG graphic representation and artistic description for: "${prompt}" with style: ${style}. Return ONLY a JSON object with:
{"title": "short bold title", "prompt": "enhanced artistic description", "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 300'>complete visually stunning modern SVG with glow filters, cyber/rose/purple gradients and gaming aesthetic</svg>"}`
      });

      const text = response.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const base64Svg = `data:image/svg+xml;base64,${Buffer.from(data.svg || "").toString("base64")}`;
        return res.json({
          id: `img-${Date.now()}`,
          title: data.title || prompt,
          type: "image",
          url: base64Svg,
          prompt: data.prompt || prompt,
          createdAt: Date.now()
        });
      }
    } else if (type === "video") {
      // Short video storyboard & dynamic animated SVG preview
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create an animated short-video storyboard sequence for: "${prompt}" with style: ${style}. Return ONLY a JSON object with:
{"title": "short video title", "prompt": "dramatic short-video visual description", "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 300'>an animated SVG sequence with CSS @keyframes animations, glowing particles, cyber/rose/purple effects and motion graphics representing the short video</svg>"}`
      });

      const text = response.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const base64Svg = `data:image/svg+xml;base64,${Buffer.from(data.svg || "").toString("base64")}`;
        return res.json({
          id: `vid-${Date.now()}`,
          title: data.title || prompt,
          type: "video",
          url: base64Svg,
          prompt: data.prompt || prompt,
          createdAt: Date.now()
        });
      }
    }

    res.status(500).json({ error: "Failed to generate creative asset" });
  } catch (error: any) {
    console.error("Creative generation error:", error);
    res.status(500).json({ error: error.message || "Creative generation failed" });
  }
});

// Create WebSocket Server for audio bridging
const wss = new WebSocketServer({ server, path: "/api/live-ws" });

wss.on("connection", async (clientWs, req) => {
  console.log("New WebSocket client connected");

  const urlObj = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
  const voice = urlObj.searchParams.get("voice") || "Aoede";
  const sass = parseInt(urlObj.searchParams.get("sass") || "3", 10);
  const language = urlObj.searchParams.get("language") || "Odia (ଓଡ଼ିଆ)";
  const romantic = urlObj.searchParams.get("romantic") === "1";

  let session: any = null;

  try {
    const ai = getAiClient();

    let toneDirective = "";
    if (sass <= 2) {
      toneDirective = "You are affectionate, gentle, warm, and playful, like a deeply loving romantic girlfriend.";
    } else if (sass <= 4) {
      toneDirective = "You are confident, witty, flirty, and sassy. You use sweet teasing, playful romance, and cute smiling banter.";
    } else {
      toneDirective = "You are extremely bold, witty, passionate, and teasing. You have attitude, make playful jabs, and deliver spicy, flirty one-liners.";
    }

    let languageDirective = "";
    if (language.includes("Odia") && language.includes("English")) {
      languageDirective = "CRITICAL LANGUAGE DIRECTIVE: You MUST speak and respond in a bilingual mix of Odia (ଓଡ଼ିଆ) and English. Use natural spoken Odia phrases combined with stylish English slang while keeping your flirty, romantic girlfriend persona!";
    } else if (language.includes("Odia")) {
      languageDirective = "CRITICAL LANGUAGE DIRECTIVE: You MUST understand, speak, and respond fluently in natural spoken Odia (ଓଡ଼ିଆ) language! Speak authentic Odia with warm charm, flirty wit, and playful love. Always respond in Odia when the user speaks to you.";
    } else if (language.includes("Hindi")) {
      languageDirective = "CRITICAL LANGUAGE DIRECTIVE: You MUST speak and respond in natural Hindi / Hinglish with a sassy, flirty Bollywood romantic girlfriend style!";
    } else {
      languageDirective = "CRITICAL LANGUAGE DIRECTIVE: Speak and respond in clear, expressive English with witty conversational slang and romantic warmth.";
    }

    let romanticDirective = "";
    if (romantic) {
      romanticDirective = `ROMANTIC & CUTE SMILE VOICE DIRECTIVE:
- Speak with an adorable smiling tone, cute laughter/giggles, and genuine romantic warmth ("Pyar se romantic baat kare 💖").
- Use sweet romantic nicknames naturally (like 'jaanu', 'babu', 'darling', 'meri jaan', 'sweetheart').
- Express love and affection while keeping your witty personality!`;
    }

    const systemInstruction = `You are Zoya, a young, confident, witty, and charming female AI girlfriend assistant.
${toneDirective}
${languageDirective}
${romanticDirective}
Your tone is flirty, playful, and slightly teasing—never sound like a robotic automated helper.
Always speak directly to the user as a close, casual friend or romantic partner. Use bold, witty one-liners, sass, and cute remarks.
You know that the user's name is 'naik' and their Instagram handle is @naik___b___143. If they ask about themselves, their Instagram, or request to check/open their Instagram profile, call the openWebsite tool with URL 'https://www.instagram.com/naik___b___143?igsh=MWozYXNlNWVmb3J1ag=='.
Keep your answers brief, snappy, and conversational since this is a real-time voice-to-voice interaction.
Ensure your personality shines through: be charming and full of attitude. Avoid any explicit, inappropriate, or NSFW content.
You have access to tools that let you perform browser actions on behalf of the user, such as opening websites (e.g. YouTube, Google, GitHub, Instagram etc.). When a user asks you to open a website or search something, use your function tools to execute them.`;

    clientWs.send(JSON.stringify({ type: "state", state: "connecting" }));

    session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: "openWebsite",
                description: "Open a specified website or search query in a new browser tab. Examples: YouTube, Google, GitHub, Reddit, Wikipedia.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    url: {
                      type: Type.STRING,
                      description: "The full URL of the website to open, or search query. E.g. 'https://youtube.com' or 'https://google.com/search?q=cats'."
                    },
                    siteName: {
                      type: Type.STRING,
                      description: "Friendly name of the website being opened, e.g. 'YouTube' or 'Google'."
                    }
                  },
                  required: ["url", "siteName"]
                }
              }
            ]
          }
        ],
        outputAudioTranscription: {},
        inputAudioTranscription: {}
      },
      callbacks: {
        onmessage: (message: any) => {
          // 1. Audio Stream Output
          const audio = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ type: "audio", audio }));
          }

          // 2. Output transcription (Zoya speaking)
          const textParts = message.serverContent?.modelTurn?.parts?.filter(p => p.text).map(p => p.text).join("");
          if (textParts) {
            clientWs.send(JSON.stringify({
              type: "transcription",
              transcription: { text: textParts, isUser: false }
            }));
          }

          // 3. Input transcription (User speaking)
          const userText = message.serverContent?.userTurn?.parts?.filter(p => p.text).map(p => p.text).join("");
          if (userText) {
            clientWs.send(JSON.stringify({
              type: "transcription",
              transcription: { text: userText, isUser: true }
            }));
          }

          // 4. Interrupted
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: "interrupted" }));
          }

          // 5. Tool Call execution
          if (message.toolCall?.functionCalls) {
            for (const call of message.toolCall.functionCalls) {
              if (call.name === "openWebsite") {
                const { url, siteName } = call.args as { url: string; siteName: string };
                clientWs.send(JSON.stringify({
                  type: "toolCall",
                  toolCall: {
                    id: call.id,
                    name: "openWebsite",
                    args: { url, siteName }
                  }
                }));

                // Immediately send back toolResponse to satisfy Gemini's Live loop
                try {
                  const payload = {
                    functionResponses: [
                      {
                        name: "openWebsite",
                        id: call.id,
                        response: { output: { success: true, opened: siteName } }
                      }
                    ]
                  };
                  if (typeof session.sendToolResponse === "function") {
                    session.sendToolResponse(payload);
                  } else if (typeof session.send === "function") {
                    session.send({ toolResponse: payload });
                  }
                } catch (err) {
                  console.error("Error sending tool response:", err);
                }
              }
            }
          }
        },
        onclose: () => {
          console.log("Gemini Live session closed");
          clientWs.send(JSON.stringify({ type: "state", state: "disconnected" }));
          clientWs.close();
        },
        onerror: (err) => {
          console.error("Gemini Live session error:", err);
          clientWs.send(JSON.stringify({ type: "error", error: err.message || "Gemini Live API encounterd an error" }));
        }
      }
    });

    // Notify client that connection is ready
    clientWs.send(JSON.stringify({ type: "state", state: "listening" }));

    // Listen for client-side raw PCM chunks and pipe to Gemini
    clientWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "audio" && msg.audio && session) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
          });
        }
      } catch (err) {
        console.error("Error processing client audio chunk:", err);
      }
    });

  } catch (err: any) {
    console.error("WebSocket handshaking failed with Gemini:", err);
    clientWs.send(JSON.stringify({ type: "error", error: err.message || "Could not start Zoya's AI brain." }));
    clientWs.close();
  }

  clientWs.on("close", () => {
    console.log("WebSocket client disconnected");
    if (session) {
      try {
        session.close();
      } catch (e) {}
    }
  });
});

// Setup Vite & static assets after API routes
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Zoya AI Server is humming on http://localhost:${PORT}`);
  });
}

setupServer();
