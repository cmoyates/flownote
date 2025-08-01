import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function Screen() {
  return (
    <View className="flex-1 justify-center items-center bg-secondary/30 flex-col">
      <View className="absolute bottom-0 left-0 right-0 flex-col justify-center items-center bg-black py-8">
        <Text className="text-lg font-semibold text-primary">FlowNote</Text>
        <Button variant={"outline"}>
          <Text>Debug</Text>
        </Button>
      </View>
    </View>
  );
}
