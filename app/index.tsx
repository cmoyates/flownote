import { useState } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function Screen() {
  const [recording, setRecording] = useState(false);

  const toggleRecording = () => {
    setRecording((prev) => !prev);
  };

  return (
    <View className="flex-1 justify-center items-center gap-5 p-6 bg-secondary/30">
      <Text>{recording ? "Recording" : "Not recording"}</Text>
      <Button onPress={toggleRecording}>
        <Text>Click Me</Text>
      </Button>
    </View>
  );
}
