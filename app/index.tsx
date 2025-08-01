import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { H1, H3, P } from "~/components/ui/typography";
import { useAudioService } from "~/services/audio";
import { refineTranscription, transcribeAudio } from "~/services/transcription";
import * as FileSystem from "expo-file-system"; // Ensure you have this import for file system operations
import { useRouter } from "expo-router";
import { DotMatrix } from "~/components/DotMatrix";

export default function Screen() {
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [refinedTranscription, setRefinedTranscription] = useState<
    string | null
  >(null);

  const router = useRouter();

  const { setupAudio, startRecording, stopRecording, recorderState } =
    useAudioService();

  const handleSetup = async () => {
    const isSetupSuccessful = await setupAudio();
    if (isSetupSuccessful) {
      console.log("Audio setup successful");
    } else {
      console.error("Audio setup failed");
    }
  };

  useEffect(() => {
    handleSetup();
  }, []);

  const handleStartRecording = async () => {
    const isRecordingStarted = await startRecording();
    if (isRecordingStarted) {
      console.log("Recording started successfully");
      setRecordingPath(null); // Reset recording path when starting a new recording
      setTranscription(null); // Clear previous transcription
      setRefinedTranscription(null); // Clear previous refined transcription
    } else {
      console.error("Failed to start recording");
    }
  };

  const handleStopRecording = async () => {
    const path = await stopRecording();
    if (path) {
      setRecordingPath(path);
      console.log("Recording stopped and saved at:", path);
    } else {
      console.error("Failed to stop recording");
    }
  };

  const handleToggleRecording = async () => {
    const isRecording = recorderState.isRecording;
    if (isRecording) {
      await handleStopRecording();
    } else {
      await handleStartRecording();
    }
  };

  const handleTranscription = async () => {
    if (!recordingPath) {
      console.error("No recording available for transcription");
      return;
    }

    try {
      // Assuming you have a transcription service set up
      const transcription = await transcribeAudio(recordingPath);
      if (transcription === undefined) {
        return;
      }

      setTranscription(transcription);
      await FileSystem.deleteAsync(recordingPath, { idempotent: true });
      setRecordingPath(null);

      console.log("Transcription:", transcription);
    } catch (error) {
      console.error("Transcription failed:", error);
    }
  };

  const handleRefineTranscription = async () => {
    if (!transcription) {
      console.error("No transcription available for refinement");
      return;
    }

    try {
      // Assuming you have a refineTranscription service set up
      const refined = await refineTranscription(transcription);
      setRefinedTranscription(refined.choices[0].message.content);

      setTranscription(null); // Clear the original transcription after refinement
      console.log("Refined Transcription:", refined.choices[0].message.content);
    } catch (error) {
      console.error("Refinement failed:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-secondary/30 flex-col">
      <View className="justify-center items-center gap-8 p-8 bg-black w-full">
        <View className="flex flex-col justify-center items-center">
          <H1>Welcome to FlowNote</H1>
          <H3>Your personal AI-powered note-taking app.</H3>
        </View>
        {recordingPath && <P>Recording saved at: {recordingPath}</P>}
        {transcription && (
          <P className="text-center">Transcription: {transcription}</P>
        )}
        {refinedTranscription && (
          <P className="text-center">
            Refined Transcription: {refinedTranscription}
          </P>
        )}
      </View>
      <View className="flex-1 w-full justify-center items-center">
        <DotMatrix />
      </View>
      <View className="w-full flex-row justify-center items-center bg-background py-8 gap-8 border-t border-secondary">
        <Button variant={"outline"} onPress={handleToggleRecording}>
          <Text>
            {recorderState.isRecording ? "Stop recording" : "Start recording"}
          </Text>
        </Button>
        <Button
          variant={"outline"}
          onPress={handleTranscription}
          disabled={!recordingPath}
        >
          <Text>Transcribe</Text>
        </Button>
        <Button
          variant={"outline"}
          onPress={handleRefineTranscription}
          disabled={!transcription}
        >
          <Text>Refine Transcription</Text>
        </Button>
      </View>
    </View>
  );
}
