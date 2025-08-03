import { Cog } from "lucide-react-native";
import { View, Alert } from "react-native";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { useEffect, useState } from "react";
import { useAPIKeyStore } from "~/stores/apiKeyStore";

const SettingsDialog = () => {
  const [openaiKey, setOpenaiKey] = useState("");
  const [notionToken, setNotionToken] = useState("");
  const [notionDatabaseID, setNotionDatabaseID] = useState("");

  const {
    openaiAPIKey: openaiAPIKeyInStore,
    notionAPIToken: notionTokenInStore,
    notionDatabaseID: notionDatabaseIDInStore,
    setOpenAIKey: setOpenAIKeyInStore,
    setNotionToken: setNotionTokenInStore,
    setNotionDatabaseID: setNotionDatabaseIDInStore,
    storeAPIKeys,
  } = useAPIKeyStore();

  useEffect(() => {
    setOpenaiKey(openaiAPIKeyInStore || "");
    setNotionToken(notionTokenInStore || "");
    setNotionDatabaseID(notionDatabaseIDInStore || "");
  }, [openaiAPIKeyInStore, notionTokenInStore, notionDatabaseIDInStore]);

  const handleSave = async () => {
    if (!openaiKey || !notionToken || !notionDatabaseID) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setOpenAIKeyInStore(openaiKey);
    setNotionTokenInStore(notionToken);
    setNotionDatabaseIDInStore(notionDatabaseID);

    await storeAPIKeys();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="aspect-square rounded-full"
          size={"sm"}
          variant={"outline"}
        >
          <Cog color={"white"} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API keys and preferences. These will be stored
            securely on your device.
          </DialogDescription>
        </DialogHeader>

        <View className="native:gap-2 gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              OpenAI API Key
            </Text>
            <Input
              placeholder="sk-..."
              value={(openaiKey as string) || ""}
              onChangeText={setOpenaiKey}
              secureTextEntry
              aria-labelledby="openai-key-label"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Notion Integration Token
            </Text>
            <Input
              placeholder="ntn_..."
              value={(notionToken as string) || ""}
              onChangeText={setNotionToken}
              secureTextEntry
              aria-labelledby="notion-token-label"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">
              Notion Database ID
            </Text>
            <Input
              placeholder="127db..."
              value={(notionDatabaseID as string) || ""}
              onChangeText={setNotionDatabaseID}
              aria-labelledby="notion-database-id-label"
            />
          </View>
        </View>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">
              <Text>Cancel</Text>
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onPress={handleSave}>
              <Text>Save</Text>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
