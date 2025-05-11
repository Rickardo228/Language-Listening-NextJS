import { API_BASE_URL } from "../consts";

export async function generateAudio(
  text: string,
  language: string,
  voice: string
): Promise<{ audioUrl: string; duration: number }> {
  const response = await fetch(`${API_BASE_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language, voice }),
  });

  if (!response.ok) {
    throw new Error("TTS request failed");
  }

  return response.json();
}
