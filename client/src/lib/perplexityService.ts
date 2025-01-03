
import { PerplexityClient } from '@perplexity-ai/sdk';

const client = new PerplexityClient({
  apiKey: process.env.PERPLEXITY_API_KEY || ''
});

export async function generateResponse(prompt: string) {
  try {
    const response = await client.chat.completions.create({
      model: "mixtral-8x7b-instruct",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error;
  }
}
