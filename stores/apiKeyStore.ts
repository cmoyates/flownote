import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface APIKeyStoreState {
  openaiAPIKey: string;
  notionAPIToken: string;
  notionDatabaseID: string;
  setOpenAIKey: (key: string) => void;
  setNotionToken: (token: string) => void;
  setNotionDatabaseID: (id: string) => void;
  initAPIKeyStore: () => Promise<boolean>;
  storeAPIKeys: () => Promise<boolean>;
}

export const useAPIKeyStore = create<APIKeyStoreState>((set, get) => {
  // #region Functions

  const setOpenAIKey = (key: string) => {
    set({ openaiAPIKey: key });
  };

  const setNotionToken = (token: string) => {
    set({ notionAPIToken: token });
  };

  const setNotionDatabaseID = (id: string) => {
    set({ notionDatabaseID: id });
  };

  const initAPIKeyStore = async () => {
    try {
      const openaiAPIKey = await SecureStore.getItemAsync(
        "FLOWNOTE_OPENAI_API_KEY",
      );
      const notionAPIToken = await SecureStore.getItemAsync(
        "FLOWNOTE_NOTION_API_TOKEN",
      );
      const notionDatabaseID = await SecureStore.getItemAsync(
        "FLOWNOTE_NOTION_DATABASE_ID",
      );
      set({
        openaiAPIKey: openaiAPIKey || "",
        notionAPIToken: notionAPIToken || "",
        notionDatabaseID: notionDatabaseID || "",
      });

      console.log("API key store initialized:", {
        openaiAPIKey,
        notionAPIToken,
        notionDatabaseID,
      });

      return true;
    } catch (error) {
      console.error("Error initializing API key store:", error);
      set({
        openaiAPIKey: "",
        notionAPIToken: "",
        notionDatabaseID: "",
      });
      return false;
    }
  };

  const storeAPIKeys = async () => {
    const { openaiAPIKey, notionAPIToken, notionDatabaseID } = get();
    try {
      await SecureStore.setItemAsync("FLOWNOTE_OPENAI_API_KEY", openaiAPIKey);
      await SecureStore.setItemAsync(
        "FLOWNOTE_NOTION_API_TOKEN",
        notionAPIToken,
      );
      await SecureStore.setItemAsync(
        "FLOWNOTE_NOTION_DATABASE_ID",
        notionDatabaseID,
      );
      return true;
    } catch (error) {
      console.error("Error storing API keys:", error);
      return false;
    }
  };

  // #endregion Functions

  return {
    openaiAPIKey: "",
    notionAPIToken: "",
    notionDatabaseID: "",
    setOpenAIKey,
    setNotionToken,
    setNotionDatabaseID,
    initAPIKeyStore,
    storeAPIKeys,
  };
});
