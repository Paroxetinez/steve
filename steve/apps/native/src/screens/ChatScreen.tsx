// @ts-nocheck
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { GiftedChat, Bubble, Send, type IMessage } from "react-native-gifted-chat";
import { Ionicons } from "@expo/vector-icons";

const CURRENT_USER_ID = "steve-user";

const INITIAL_MESSAGES: IMessage[] = [
  {
    _id: "m3",
    text: "太好了。你先告诉我你今天最想聊哪件事：工作、关系、还是情绪？",
    createdAt: new Date(Date.now() - 1000 * 60 * 2),
    user: {
      _id: "steve-bot",
      name: "Steve",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
  },
  {
    _id: "m2",
    text: "我最近有点焦虑，想找个人聊聊。",
    createdAt: new Date(Date.now() - 1000 * 60 * 4),
    user: {
      _id: CURRENT_USER_ID,
      name: "You",
    },
  },
  {
    _id: "m1",
    text: "你好，我是 Steve。我们可以一起把复杂的想法说清楚。",
    createdAt: new Date(Date.now() - 1000 * 60 * 6),
    user: {
      _id: "steve-bot",
      name: "Steve",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
  },
];

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState<IMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);

  const onSend = useCallback((nextMessages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, nextMessages),
    );

    setIsTyping(true);
    const latest = nextMessages[0];

    setTimeout(() => {
      const reply: IMessage = {
        _id: `reply-${Date.now()}`,
        text: latest?.text
          ? `收到，你刚刚说的是：“${latest.text}”。我们继续往下拆解一下。`
          : "收到，我们继续聊。",
        createdAt: new Date(),
        user: {
          _id: "steve-bot",
          name: "Steve",
          avatar: "https://i.pravatar.cc/100?img=12",
        },
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [reply]),
      );
      setIsTyping(false);
    }, 800);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }

            navigation.navigate("MainTabs", { screen: "InboxScreen" });
          }}
          style={styles.headerIconButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Steve Chat</Text>
          <Text style={styles.headerSubtitle}>在线</Text>
        </View>
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: CURRENT_USER_ID, name: "You" }}
        isTyping={isTyping}
        isScrollToBottomEnabled
        isSendButtonAlwaysVisible
        renderBubble={(props) => (
          <Bubble
            {...props}
            wrapperStyle={{
              left: styles.leftBubble,
              right: styles.rightBubble,
            }}
            textStyle={{
              left: styles.leftBubbleText,
              right: styles.rightBubbleText,
            }}
          />
        )}
        renderSend={(props) => (
          <Send {...props} containerStyle={styles.sendContainer}>
            <View style={styles.sendButton}>
              <Ionicons name="send" size={16} color="#fff" />
            </View>
          </Send>
        )}
        timeTextStyle={{
          left: styles.leftTime,
          right: styles.rightTime,
        }}
        messagesContainerStyle={styles.messagesContainer}
        listProps={{
          maintainVisibleContentPosition: {
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          },
        }}
        keyboardAvoidingViewProps={
          Platform.OS === "android" ? { keyboardVerticalOffset: 8 } : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    color: "#111827",
    fontFamily: "SemiBold",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 2,
    fontFamily: "Regular",
  },
  messagesContainer: {
    backgroundColor: "#F8FAFC",
  },
  leftBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 2,
  },
  rightBubble: {
    backgroundColor: "#0D87E1",
    paddingVertical: 2,
  },
  leftBubbleText: {
    color: "#111827",
    fontFamily: "Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  rightBubbleText: {
    color: "#FFFFFF",
    fontFamily: "Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  leftTime: {
    color: "#6B7280",
    fontSize: 10,
  },
  rightTime: {
    color: "#DBEAFE",
    fontSize: 10,
  },
  sendContainer: {
    justifyContent: "center",
    marginRight: 6,
    marginBottom: 4,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0D87E1",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ChatScreen;
