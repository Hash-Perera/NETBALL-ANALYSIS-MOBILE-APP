import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { BASEURL } from "../../constants";

export default function ChatBotButton() {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en"); // "en" | "si"
  const listRef = useRef(null);

  const t = useMemo(() => {
    return language === "si"
      ? {
          title: "Netball Chat Bot",
          close: "වසන්න",
          placeholder: "ඔබගේ ප්‍රශ්නය-type කරන්න…",
          typing: "බොට් පණිවිඩයක් ලියමින්…",
          welcome: "හයි! Netball ගැන ඕනෑම දෙයක් අහන්න 😊",
          chat: "චැට්",
          send: "යවන්න",
        }
      : {
          title: "Netball Chat Bot",
          close: "Close",
          placeholder: "Type your question…",
          typing: "Bot is typing…",
          welcome: "Hi! Ask me anything about Netball 😊",
          chat: "Chat",
          send: "Send",
        };
  }, [language]);

  const open = () => {
    setVisible(true);
    if (messages.length === 0) {
      setMessages([
        {
          id: uid(),
          role: "bot",
          text: t.welcome,
          createdAt: Date.now(),
        },
      ]);
    }
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const close = () => setVisible(false);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  const push = (msg) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: uid(), createdAt: Date.now() },
    ]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    // add user msg
    push({ role: "user", text });
    setInput("");

    try {
      setLoading(true);

      // short history (last 8 messages) for context
      const lastMsgs = messages.slice(-8).map((m) => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.text,
      }));

      const res = await fetch(BASEURL + "chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          messages: [...lastMsgs, { role: "user", content: text }],
        }),
      });

      const data = await res.json();
      const botText =
        data?.reply ||
        (language === "si"
          ? "සමාවන්න, මට පිළිතුර ලබා දීමට අපහසු විය."
          : "Sorry, I had trouble answering that.");
      push({ role: "bot", text: botText });
    } catch (e) {
      console.log(e);
      push({
        role: "bot",
        text:
          language === "si"
            ? "ජාල දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න."
            : "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, language]);

  const switchLang = (next) => {
    const nextLang = next === "si" ? "si" : "en";
    setLanguage(nextLang);
    if (visible && messages.length === 1 && messages[0].role === "bot") {
      setMessages([
        {
          ...messages[0],
          text:
            nextLang === "si"
              ? "හයි! Netball ගැන ඕනෑම දෙයක් අහන්න 😊"
              : "Hi! Ask me anything about Netball 😊",
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating button */}
      <TouchableOpacity style={styles.fab} onPress={open}>
        <Text style={styles.fabText}>{t.chat}</Text>
      </TouchableOpacity>

      {/* Chat modal */}
      <Modal visible={visible} animationType="slide" onRequestClose={close}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "#fff" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.title}</Text>

            {/* Language toggle */}
            <View style={styles.langRow}>
              <TouchableOpacity
                onPress={() => switchLang("en")}
                style={[
                  styles.langBtn,
                  language === "en" && styles.langBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    language === "en" && styles.langBtnTextActive,
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchLang("si")}
                style={[
                  styles.langBtn,
                  language === "si" && styles.langBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    language === "si" && styles.langBtnTextActive,
                  ]}
                >
                  SI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={close} style={{ marginLeft: 8 }}>
                <Text style={styles.headerClose}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble role={item.role} text={item.text} />
            )}
            contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          {/* Typing indicator */}
          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator />
              <Text style={{ marginLeft: 8 }}>{t.typing}</Text>
            </View>
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              placeholder={t.placeholder}
              value={input}
              onChangeText={setInput}
              style={styles.input}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={onSend}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && { opacity: 0.5 }]}
            >
              <Text style={styles.sendText}>{t.send}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function MessageBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <View
      style={[
        styles.bubbleRow,
        isUser
          ? { justifyContent: "flex-end" }
          : { justifyContent: "flex-start" },
      ]}
    >
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? { color: "#fff" } : { color: "#0b1a2b" },
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#1e90ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 3,
  },
  fabText: { color: "#fff", fontWeight: "600" },
  header: {
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerClose: { color: "#1e90ff", fontWeight: "600" },
  langRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f4f9",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  langBtnActive: {
    backgroundColor: "#e7f1ff",
    borderColor: "#1e90ff",
  },
  langBtnText: { fontWeight: "700", color: "#334155" },
  langBtnTextActive: { color: "#1e90ff" },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 16,
  },
  bubbleRow: { flexDirection: "row", marginVertical: 4 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userBubble: { backgroundColor: "#1e90ff", borderTopRightRadius: 4 },
  botBubble: { backgroundColor: "#f0f3f7", borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f7f9fc",
    borderRadius: 12,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#1e90ff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendText: { color: "#fff", fontWeight: "700" },
});
