
const API_URL = 'https://api.perplexity.ai/chat/completions';

export async function generateResponse(prompt: string) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-instruct",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error;
  }
}
