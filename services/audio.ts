import { Alert } from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";

export const useAudioService = () => {
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder);

  const setupAudio = async () => {
    try {
      // Request recording permissions
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission to access microphone was denied");
        return false;
      }

      // Set audio mode for recording
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      return true;
    } catch (error) {
      console.error("Error setting up audio:", error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      console.log("Recording started");
      return true;
    } catch (error) {
      console.error("Recording start error:", error);
      Alert.alert("Recording Error", "Failed to start recording");
      return false;
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      console.log("Recording stopped. File saved at:", audioRecorder.uri);
      Alert.alert(
        "Recording Completed",
        `Recording saved at: ${audioRecorder.uri}`
      );
      return audioRecorder.uri;
    } catch (error) {
      console.error("Recording stop error:", error);
      Alert.alert("Recording Error", "Failed to stop recording");
      return null;
    }
  };

  const toggleRecording = async () => {
    if (recorderState.isRecording) {
      return await stopRecording();
    } else {
      const success = await startRecording();
      return success;
    }
  };

  return {
    audioRecorder,
    recorderState,
    setupAudio,
    startRecording,
    stopRecording,
    toggleRecording,
  };
};
