import { BlockObjectRequest, Client, isFullPage } from "@notionhq/client";
import { marked } from "marked";
import { NotionToMarkdown } from "notion-to-md";

// Initialize the Notion client
const notion = new Client({
  auth: process.env.EXPO_PUBLIC_NOTION_TOKEN, // Using EXPO_PUBLIC_ prefix for Expo environment variables
});

export const n2m = new NotionToMarkdown({ notionClient: notion });

export const NOTION_DATABASE_ID =
  process.env.EXPO_PUBLIC_NOTION_DATABASE_ID || "";

export const notionToMarkdown = async (pageID: string, noTitle?: boolean) => {
  const mdBlocks = await n2m.pageToMarkdown(pageID);
  const mdString = n2m.toMarkdownString(mdBlocks);

  if (noTitle) return mdString.parent;

  const pageTitle = await getPageTitle(pageID);

  return `# ${pageTitle}\n\n${mdString.parent}`;
};

export const getPageTitle = async (pageID: string) => {
  try {
    const page = await notion.pages.retrieve({ page_id: pageID });

    // Use type guard to ensure we have a full page response
    if (!isFullPage(page)) {
      throw new Error("Unable to retrieve full page details");
    }

    // Extract title from page properties
    // The title is usually in a property called "title" or could be the first title property
    const titleProperty = Object.values(page.properties).find(
      (property) => property.type === "title",
    );

    if (titleProperty && titleProperty.type === "title") {
      // Extract plain text from title
      const title = titleProperty.title.map((text) => text.plain_text).join("");
      return title;
    }

    // Fallback: if no title property found, return empty string
    return "";
  } catch (error) {
    console.error("Error retrieving page title:", error);
    throw error;
  }
};

const markdownToNotionBlocks = (markdown: string) => {
  const tokens = marked.lexer(markdown);
  const blocks: BlockObjectRequest[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "heading":
        // Only support heading_1, heading_2, heading_3 as per Notion API
        const headingType =
          token.depth === 1
            ? "heading_1"
            : token.depth === 2
              ? "heading_2"
              : "heading_3";
        if (headingType === "heading_1") {
          blocks.push({
            object: "block",
            type: "heading_1",
            heading_1: {
              rich_text: [{ type: "text", text: { content: token.text } }],
            },
          });
        } else if (headingType === "heading_2") {
          blocks.push({
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: token.text } }],
            },
          });
        } else {
          blocks.push({
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [{ type: "text", text: { content: token.text } }],
            },
          });
        }
        break;

      case "paragraph":
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: token.text } }],
          },
        });
        break;

      case "code":
        blocks.push({
          object: "block",
          type: "code",
          code: {
            rich_text: [{ type: "text", text: { content: token.text } }],
            language: token.lang || "plain text",
          },
        });
        break;

      case "list":
        // This is a simplified list handling. Notion's list API is more complex.
        for (const item of token.items) {
          blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ type: "text", text: { content: item.text } }],
            },
          });
        }
        break;

      case "space":
        // Marked creates 'space' tokens between blocks, which we can often ignore.
        break;

      default:
        console.warn(`Unsupported token type: ${token.type}. Skipping.`);
    }
  }

  return blocks;
};

export const addNoteToNotion = async (markdown: string, databaseId: string) => {
  try {
    const blocks = markdownToNotionBlocks(markdown);

    console.log("Blocks to be added:", blocks);

    if (blocks.length === 0) {
      console.warn("No blocks to add to Notion.");
      return;
    }

    let title = "New Note";

    if (blocks[0].type === "heading_1") {
      // If the first block is a heading, we can use it as the page title
      const richTextItem = blocks[0].heading_1.rich_text[0];
      title = richTextItem.type === "text" ? richTextItem.text.content : "";
      blocks.shift(); // Remove the title block from the list of blocks to add
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: blocks,
    });
    console.log("Page created successfully:", response);
  } catch (error) {
    console.error("Error creating page in Notion:", error);
  }
};
