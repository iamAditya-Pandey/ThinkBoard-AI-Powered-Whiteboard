const API_URL = "https://api.mistral.ai/v1/chat/completions";

export const generateMistralResponse = async (prompt: string, systemPrompt: string) => {
  const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error("Mistral API Key is missing. Please add VITE_MISTRAL_API_KEY to your .env file.");
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "mistral-tiny",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Mistral API Request Failed");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Mistral API Error:", error);
    throw error;
  }
};