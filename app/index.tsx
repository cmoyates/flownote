import { useEffect } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { useAudioService } from "~/services/audio";
import { refineTranscription, transcribeAudio } from "~/services/transcription";
import * as FileSystem from "expo-file-system";
import { DotMatrix } from "~/components/DotMatrix";
import { Mic } from "lucide-react-native";
import { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { addNoteToNotion, NOTION_DATABASE_ID } from "~/services/notion";
import SettingsDialog from "~/components/SettingsDialog";
import { useAPIKeyStore } from "~/stores/apiKeyStore";

export default function Screen() {
  const maxBrightness = useSharedValue(0.5);
  const speed = useSharedValue(0.00025);
  const paused = useSharedValue(false);

  const { setupAudio, startRecording, stopRecording, recorderState } =
    useAudioService();

  const { initAPIKeyStore, notionAPIToken, openaiAPIKey } = useAPIKeyStore();

  const handleSetup = async () => {
    const isSetupSuccessful = await setupAudio();
    if (isSetupSuccessful) {
      console.log("Audio setup successful");
    } else {
      console.error("Audio setup failed");
    }

    const isAPIKeyStoreInitialized = await initAPIKeyStore();
    if (isAPIKeyStoreInitialized) {
      console.log("API Key Store initialized successfully");
    } else {
      console.error("Failed to initialize API Key Store");
    }
  };

  useEffect(() => {
    handleSetup();
  }, []);

  const handleStartRecording = async () => {
    const isRecordingStarted = await startRecording();
    if (isRecordingStarted) {
      console.log("Recording started successfully");

      speed.value = withTiming(0.0005, {
        duration: 2000,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      maxBrightness.value = withTiming(1.0, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
    } else {
      console.error("Failed to start recording");
    }
  };

  const handleStopRecording = async () => {
    const path = await stopRecording();
    if (path) {
      speed.value = withTiming(0.00025, {
        duration: 2000,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      maxBrightness.value = withTiming(0.5, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });

      console.log("Recording stopped and saved at:", path);

      return path; // Return the recording path for further processing
    } else {
      console.error("Failed to stop recording");
    }
  };

  const handleToggleRecording = async () => {
    const isRecording = recorderState.isRecording;
    if (isRecording) {
      const recordingPath = await handleStopRecording();
      if (!recordingPath) {
        console.error("No recording path available");
        return;
      }

      const transcription = await handleTranscription(recordingPath);
      if (!transcription) {
        console.error("No transcription available");
        return;
      }

      const refinedTranscription =
        await handleRefineTranscription(transcription);
      if (!refinedTranscription) {
        console.error("No refined transcription available");
        return;
      }

      console.log("Note:", refinedTranscription);

      addNoteToNotion(notionAPIToken, refinedTranscription, NOTION_DATABASE_ID);
    } else {
      await handleStartRecording();
    }
  };

  const handleTranscription = async (recordingPath: string) => {
    try {
      // Assuming you have a transcription service set up
      const transcription = await transcribeAudio(openaiAPIKey, recordingPath);
      if (transcription === undefined) {
        return;
      }

      await FileSystem.deleteAsync(recordingPath, { idempotent: true });

      console.log("Transcription:", transcription);

      return transcription;
    } catch (error) {
      console.error("Transcription failed:", error);
    }
  };

  const handleRefineTranscription = async (transcription: string) => {
    if (!transcription) {
      console.error("No transcription available for refinement");
      return;
    }

    try {
      // Assuming you have a refineTranscription service set up
      const refinedTranscription = await refineTranscription(
        openaiAPIKey,
        transcription,
      );

      console.log(
        "Refined Transcription:",
        refinedTranscription.choices[0].message.content,
      );

      return refinedTranscription.choices[0].message.content;
    } catch (error) {
      console.error("Refinement failed:", error);
    }
  };

  return (
    <View className="flex-1 flex-col items-center justify-center bg-secondary/30">
      <View className="w-full flex-1 items-center justify-center">
        <DotMatrix
          speed={speed}
          maxBrightness={maxBrightness}
          paused={paused}
        />
      </View>
      <View className="absolute bottom-0 w-full flex-row items-center justify-center gap-8 py-8">
        <Button
          className="aspect-square"
          size={"lg"}
          onPress={handleToggleRecording}
          style={{
            backgroundColor: recorderState.isRecording ? "red" : "white",
          }}
        >
          <Mic color={recorderState.isRecording ? "white" : "black"} />
        </Button>
      </View>
      <View className="absolute right-0 top-0 m-4 flex-row items-center gap-2">
        <SettingsDialog />
      </View>
    </View>
  );
}
