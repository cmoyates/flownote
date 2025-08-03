export const transcribeAudio = async (openaiAPIKey: string, uri: string) => {
  try {
    console.log("Transcribing audio with OpenAI API Key:", openaiAPIKey);

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: `recording.m4a`,
      type: `audio/m4a`,
    } as any);
    formData.append("model", "gpt-4o-mini-transcribe");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiAPIKey}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      },
    );

    const data = await response.json();
    return data.text as string;
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error; // Re-throw the error so the calling function can handle it
  }
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const refineTranscription = async (
  openaiAPIKey: string,
  transcript: string,
) => {
  const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `
        You are a helpful assistant that cleans up transcriptions. 
        Please remove any unnecessary filler words, pauses, or repetitions from the transcription. 
        Your response should be in markdown format with an H1 at the top acting as the title of the transcription.
        The title should be concise and relevant to the content of the transcription.
        `,
    },
    {
      role: "user",
      content: `Please clean up the following transcription:\n\n${transcript}`,
    },
  ];

  const requestBody = {
    model: "gpt-4.1-mini",
    messages: messages,
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiAPIKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    throw error; // Re-throw the error so the calling function can handle it
  }
};
