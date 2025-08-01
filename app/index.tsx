import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { useAudioService } from "~/services/audio";
import { refineTranscription, transcribeAudio } from "~/services/transcription";
import * as FileSystem from "expo-file-system";
import { DotMatrix } from "~/components/DotMatrix";
import { Mic, Pause, X } from "lucide-react-native";

export default function Screen() {
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [refinedTranscription, setRefinedTranscription] = useState<
    string | null
  >(null);

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
      <View className="flex-1 w-full justify-center items-center">
        <DotMatrix />
      </View>
      <View className="w-full flex-row justify-center items-center bg-background py-8 gap-8 border-t border-secondary">
        <Button
          variant={"outline"}
          className="aspect-square"
          disabled={!recorderState.isRecording}
        >
          <X color="white" />
        </Button>
        <Button
          className="aspect-square"
          onPress={handleToggleRecording}
          style={{
            backgroundColor: recorderState.isRecording ? "red" : "white",
          }}
        >
          <Mic color={recorderState.isRecording ? "white" : "black"} />
        </Button>
        <Button
          variant={"outline"}
          className="aspect-square"
          disabled={!recorderState.isRecording}
        >
          <Pause color="white" />
        </Button>
      </View>
    </View>
  );
}
