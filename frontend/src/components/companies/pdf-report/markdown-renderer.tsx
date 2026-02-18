import { Text, View } from "@react-pdf/renderer";
import { marked } from "marked";
import type { Token, Tokens } from "marked";
import { styles } from "./pdf-styles";

function renderInlineTokens(tokens: Token[]): React.ReactNode[] {
  return tokens.map((token, i) => {
    if (token.type === "strong") {
      return (
        <Text key={i} style={styles.bold}>
          {(token as Tokens.Strong).text}
        </Text>
      );
    }
    if (token.type === "em") {
      return (
        <Text key={i} style={styles.italic}>
          {(token as Tokens.Em).text}
        </Text>
      );
    }
    if (token.type === "codespan") {
      return (
        <Text key={i} style={styles.bold}>
          {(token as Tokens.Codespan).text}
        </Text>
      );
    }
    if (token.type === "link") {
      return <Text key={i}>{(token as Tokens.Link).text}</Text>;
    }
    if ("text" in token) {
      return <Text key={i}>{(token as { text: string }).text}</Text>;
    }
    if ("raw" in token) {
      return <Text key={i}>{(token as { raw: string }).raw}</Text>;
    }
    return null;
  });
}

function renderToken(token: Token, index: number): React.ReactNode {
  switch (token.type) {
    case "heading": {
      const heading = token as Tokens.Heading;
      const style =
        heading.depth <= 1
          ? styles.sectionTitle
          : heading.depth === 2
            ? styles.subsectionTitle
            : styles.label;
      return (
        <Text key={index} style={style}>
          {heading.text}
        </Text>
      );
    }
    case "paragraph": {
      const para = token as Tokens.Paragraph;
      return (
        <Text key={index} style={styles.paragraph}>
          {para.tokens ? renderInlineTokens(para.tokens) : para.text}
        </Text>
      );
    }
    case "list": {
      const list = token as Tokens.List;
      return (
        <View key={index} style={styles.mb8}>
          {list.items.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>{list.ordered ? `${i + 1}.` : "\u2022"}</Text>
              <Text style={styles.listText}>{item.text}</Text>
            </View>
          ))}
        </View>
      );
    }
    case "space":
      return <View key={index} style={{ marginBottom: 4 }} />;
    case "hr":
      return (
        <View
          key={index}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "#e2e8f0",
            marginVertical: 10,
          }}
        />
      );
    default: {
      if ("text" in token) {
        return (
          <Text key={index} style={styles.paragraph}>
            {(token as { text: string }).text}
          </Text>
        );
      }
      return null;
    }
  }
}

export function MarkdownContent({ content }: { content: string }) {
  const tokens = marked.lexer(content);
  return <View>{tokens.map((token, i) => renderToken(token, i))}</View>;
}
