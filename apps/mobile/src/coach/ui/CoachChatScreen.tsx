import React, { useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CoachContext } from '@nutrio/nutrition-core';
import { sendCoachMessage } from '../../ai/ai-service.js';
import {
  getActiveAiProvider,
  getStoredGeminiKey,
  getStoredOpenAiKey,
  saveGeminiKey,
  saveOpenAiKey,
  setActiveAiProvider,
} from '../../ai/apiKeyStorage.js';
import { AiProvider } from '../../ai/types.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface CoachChatScreenProps {
  context: CoachContext;
  onBack: () => void;
}

const DEFAULT_CHIPS = [
  'How to reduce oil in Karahi?',
  'Eating at a shaadi dinner tonight',
  'Healthy doodh patti chai alternatives',
  'High protein Pakistani snacks',
];

export const CoachChatScreen: React.FC<CoachChatScreenProps> = ({
  context,
  onBack,
}) => {
  const { theme, isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      role: 'assistant',
      text: `Assalam-o-Alaikum ${context.displayName || 'there'}! I'm your Nutrio Nutrition Coach.\n\nYou have ~${
        context.todaySummary?.remainingCalories ?? context.targets.kcalTarget
      } kcal remaining today. How can I help you adjust your meals, handle a dawat, or cut down on excess cooking oil?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [suggestedChips, setSuggestedChips] = useState<string[]>(DEFAULT_CHIPS);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Settings Modal State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(() => getActiveAiProvider());
  const [openAiKeyInput, setOpenAiKeyInput] = useState(() => getStoredOpenAiKey() || '');
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getStoredGeminiKey() || '');

  const handleSaveSettings = () => {
    saveOpenAiKey(openAiKeyInput);
    saveGeminiKey(geminiKeyInput);
    setActiveAiProvider(selectedProvider);
    setSettingsVisible(false);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: 'Just now',
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await sendCoachMessage(
        newMessages.map((m) => ({
          role: m.role,
          content: m.text,
        })),
        context
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.reply,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.suggestedPrompts && response.suggestedPrompts.length > 0) {
        setSuggestedChips(response.suggestedPrompts);
      }
    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I'm having a brief issue connecting to my nutrition intelligence engine. As general advice: for Pakistani dinners, fill half your plate with cucumber/salad, prioritize lean protein, and limit fried puris or naans to 1 portion.",
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <View style={styles.btnRow}>
            <Icon name="arrow-left" size={14} color={theme.colors.textPrimary} />
            <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>Back</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Icon name="sparkles" size={16} color={isDark ? theme.colors.primaryLime : '#4B6200'} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>AI Nutrition Coach</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Desi-Calibrated Intelligence
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.headerRightBadge,
            {
              backgroundColor: isDark ? 'rgba(164, 235, 63, 0.15)' : '#F7FEE7',
              borderColor: theme.colors.primaryLime,
            },
          ]}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.badgeRow}>
            <Icon name="settings" size={12} color={isDark ? theme.colors.primaryLime : '#4B6200'} />
            <Text style={[styles.badgeText, { color: isDark ? theme.colors.primaryLime : '#4B6200' }]}>
              {selectedProvider.toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Chat Scroll Area */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesPad}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.messageBubble,
                m.role === 'user' ? styles.userBubble : styles.assistantBubble,
                m.role === 'assistant' && {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {m.role === 'assistant' && (
                <Text
                  style={[
                    styles.avatarLabel,
                    { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                  ]}
                >
                  NUTRIO COACH
                </Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  m.role === 'user' ? styles.userText : [styles.assistantText, { color: theme.colors.textPrimary }],
                ]}
              >
                {m.text}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  { color: m.role === 'user' ? '#333A00' : theme.colors.textMuted },
                ]}
              >
                {m.timestamp}
              </Text>
            </View>
          ))}

          {isTyping && (
            <View
              style={[
                styles.messageBubble,
                styles.assistantBubble,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.typingIndicator,
                  { color: isDark ? theme.colors.primaryLime : '#4B6200' },
                ]}
              >
                AI Coach is typing...
              </Text>
            </View>
          )}

          {/* Suggested Prompts Chips */}
          <View style={styles.chipsSection}>
            <Text style={[styles.chipsHeader, { color: theme.colors.textMuted }]}>
              SUGGESTED TOPICS
            </Text>
            <View style={styles.chipsWrap}>
              {suggestedChips.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => handleSend(chip)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: theme.colors.textPrimary }]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
            placeholder="Ask about meals, oil, dawats, chai..."
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: theme.colors.primaryLime },
              (!inputText.trim() || isTyping) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* AI Key Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.settingsOverlay}>
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.settingsHeader}>
              <View style={styles.titleRow}>
                <Icon
                  name="settings"
                  size={18}
                  color={isDark ? theme.colors.primaryLime : '#4B6200'}
                />
                <Text style={[styles.settingsTitle, { color: theme.colors.textPrimary }]}>
                  AI Engine Settings
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Text style={[styles.settingsClose, { color: theme.colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.settingsSub, { color: theme.colors.textSecondary }]}>
              Connect your OpenAI or Google Gemini API key. If left blank, Nutrio uses its calibrated built-in Pakistani nutrition intelligence.
            </Text>

            {/* Provider Selector */}
            <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>
              ACTIVE PROVIDER
            </Text>
            <View style={styles.providerRow}>
              {(['auto', 'openai', 'gemini'] as AiProvider[]).map((p) => {
                const isSelected = selectedProvider === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.providerPill,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primaryLime
                          : theme.colors.surfaceSecondary,
                      },
                    ]}
                    onPress={() => setSelectedProvider(p)}
                  >
                    <Text
                      style={[
                        styles.providerPillText,
                        {
                          color: isSelected ? '#0A0B0D' : theme.colors.textPrimary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* OpenAI Key */}
            <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>
              OPENAI API KEY (optional)
            </Text>
            <TextInput
              style={[
                styles.settingsInput,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder="sk-proj-..."
              placeholderTextColor={theme.colors.textMuted}
              value={openAiKeyInput}
              onChangeText={setOpenAiKeyInput}
              secureTextEntry={true}
            />

            {/* Gemini Key */}
            <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>
              GOOGLE GEMINI API KEY (optional)
            </Text>
            <TextInput
              style={[
                styles.settingsInput,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder="AIzaSy..."
              placeholderTextColor={theme.colors.textMuted}
              value={geminiKeyInput}
              onChangeText={setGeminiKeyInput}
              secureTextEntry={true}
            />

            <TouchableOpacity
              style={[
                styles.saveSettingsBtn,
                { backgroundColor: theme.colors.primaryLime },
              ]}
              onPress={handleSaveSettings}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveSettingsBtnText, { color: theme.colors.limeText }]}>
                Save AI Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRightBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesPad: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    padding: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#A4EB3F',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  avatarLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#0A0B0D',
    fontWeight: '700',
  },
  assistantText: {
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  chipsSection: {
    marginTop: 14,
    gap: 8,
  },
  chipsHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#0A0B0D',
    fontSize: 18,
    fontWeight: '900',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  settingsCard: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  settingsClose: {
    fontSize: 18,
    fontWeight: '700',
    padding: 4,
  },
  settingsSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  providerPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  providerPillText: {
    fontSize: 11,
  },
  settingsInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    borderWidth: 1,
    marginBottom: 14,
  },
  saveSettingsBtn: {
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveSettingsBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
});
