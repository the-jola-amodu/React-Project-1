import runChat from "../backend/ai.js";

export const config = {
  runtime: "nodejs",
};


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try{
    const response = await runChat(prompt);
    return res.status(200).json({ response });
  } catch(error){
    console.error("runChat error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }  
}