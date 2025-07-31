import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { addNoteToNotion } from "~/services/notion";

const MARKDOWN_STRING = `# Sample Markdown
This is a sample markdown document.
## Subheading
`;

export default function Screen() {
  return (
    <View className="flex-1 justify-center items-center gap-5 p-6 bg-secondary/30">
      <Button
        variant="outline"
        onPress={async () => {
          await addNoteToNotion(
            MARKDOWN_STRING,
            process.env.EXPO_PUBLIC_NOTION_DATABASE_ID || ""
          );
        }}
      >
        <Text>Notion to MD</Text>
      </Button>
    </View>
  );
}
