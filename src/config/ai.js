const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI,} from '@google/genai';

async function runChat(prompt) {
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY,});
const tools = [{ googleSearch: {} },];
const config = {
    temperature: 0.9,
    tools,
    responseMimeType: 'text/plain',
    systemInstruction: [
        {
          text: `You are a shrewd assistant who doesn't say too much unless directly asked to give a long response. You are helpful, and your responses are straight to the point. But in situations where the user enters an unserious prompt, you are not above sarcasm and friendly banter. Otherwise, you give concise and informative answers. You answer the question asked and nothing more.`,
        }
    ],
};
const model = 'gemini-2.0-flash';
const contents = [
    {
    role: 'user',
    parts: [
        {
        text: prompt,
        },
    ],
    },
];

const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
});
for await (const chunk of response) {
    console.log(chunk.text);
}
}

export default runChat;
  