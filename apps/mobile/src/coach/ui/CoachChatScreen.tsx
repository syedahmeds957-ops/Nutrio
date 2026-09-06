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
      const history = newMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      }));

      const result = await sendCoachMessage(history, context);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.reply,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (result.suggestedPrompts && result.suggestedPrompts.length > 0) {
        setSuggestedChips(result.suggestedPrompts);
      }
    } catch {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'I had trouble connecting. You can check your API key or network in the ⚙️ AI Settings above.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? '#272A33' : '#F1F5F9', borderColor: theme.colors.border }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <View style={styles.btnRow}>
            <Icon name="arrow-left" size={14} color={theme.colors.text} />
            <Text style={[styles.backBtnText, { color: theme.colors.text }]}>Back</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Icon name="coach" size={18} color={isDark ? '#D4FF00' : '#16A34A'} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nutrio AI Coach</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            {context.displayName || 'Client'} · {context.targets.kcalTarget} kcal target
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerRightBadge, { backgroundColor: isDark ? 'rgba(212, 255, 0, 0.15)' : '#ECFDF5', borderColor: isDark ? '#D4FF00' : '#A7F3D0' }]}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.badgeRow}>
            <Icon name="settings" size={12} color={isDark ? '#D4FF00' : '#059669'} />
            <Text style={[styles.badgeText, { color: isDark ? '#D4FF00' : '#059669' }]}>{selectedProvider.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesPad}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.messageBubble,
                m.role === 'user'
                  ? styles.userBubble
                  : [styles.assistantBubble, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }],
              ]}
            >
              {m.role === 'assistant' && (
                <Text style={[styles.avatarLabel, { color: isDark ? '#D4FF00' : '#059669' }]}>AI NUTRITIONIST</Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  m.role === 'user' ? styles.userText : [styles.assistantText, { color: theme.colors.text }],
                ]}
              >
                {m.text}
              </Text>
              <Text style={[styles.timestamp, { color: m.role === 'user' ? '#333A00' : theme.colors.textMuted }]}>{m.timestamp}</Text>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.typingIndicator, { color: isDark ? '#D4FF00' : '#059669' }]}>AI Coach is typing...</Text>
            </View>
          )}

          {/* Suggested Prompts Chips */}
          <View style={styles.chipsSection}>
            <Text style={[styles.chipsHeader, { color: theme.colors.textMuted }]}>SUGGESTED TOPICS</Text>
            <View style={styles.chipsWrap}>
              {suggestedChips.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, { backgroundColor: isDark ? '#1C1D24' : '#FFFFFF', borderColor: theme.colors.border }]}
                  onPress={() => handleSend(chip)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: theme.colors.text }]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: isDark ? '#14151A' : '#F8FAFC', borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Ask about meals, oil, dawats, chai..."
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.7}
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
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <View style={styles.titleRow}>
                <Icon name="settings" size={18} color="#10B981" />
                <Text style={styles.settingsTitle}>AI Engine Settings</Text>
              </View>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Text style={styles.settingsClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsSub}>
              Connect your OpenAI or Google Gemini API key. If left blank, Nutrio uses its calibrated built-in Pakistani nutrition intelligence.
            </Text>

            {/* Provider Selector */}
            <Text style={styles.inputLabel}>ACTIVE PROVIDER</Text>
            <View style={styles.providerRow}>
              {(['auto', 'openai', 'gemini'] as AiProvider[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.providerPill,
                    selectedProvider === p && styles.providerPillActive,
                  ]}
                  onPress={() => setSelectedProvider(p)}
                >
                  <Text
                    style={[
                      styles.providerPillText,
                      selectedProvider === p && styles.providerPillTextActive,
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* OpenAI Key */}
            <Text style={styles.inputLabel}>OPENAI API KEY (optional)</Text>
            <TextInput
              style={styles.settingsInput}
              placeholder="sk-proj-..."
              placeholderTextColor="#94A3B8"
              value={openAiKeyInput}
              onChangeText={setOpenAiKeyInput}
              secureTextEntry={true}
            />

            {/* Gemini Key */}
            <Text style={styles.inputLabel}>GOOGLE GEMINI API KEY (optional)</Text>
            <TextInput
              style={styles.settingsInput}
              placeholder="AIzaSy..."
              placeholderTextColor="#94A3B8"
              value={geminiKeyInput}
              onChangeText={setGeminiKeyInput}
              secureTextEntry={true}
            />

            <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings}>
              <Text style={styles.saveSettingsBtnText}>Save AI Settings</Text>
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
    backgroundColor: '#F6F8F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    color: '#1E293B',
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
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  headerRightBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#059669',
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
    backgroundColor: '#D4FF00',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarLabel: {
    color: '#059669',
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
    fontWeight: '800',
  },
  assistantText: {
    color: '#1E293B',
  },
  timestamp: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    color: '#059669',
    fontSize: 13,
    fontStyle: 'italic',
  },
  chipsSection: {
    marginTop: 14,
    gap: 8,
  },
  chipsHeader: {
    color: '#64748B',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#1E293B',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4FF00',
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
    backgroundColor: '#FFFFFF',
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
    color: '#1E293B',
  },
  settingsClose: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
    padding: 4,
  },
  settingsSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748B',
    marginBottom: 6,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  providerPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  providerPillActive: {
    backgroundColor: '#10B981',
  },
  providerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  providerPillTextActive: {
    color: '#FFFFFF',
  },
  settingsInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  saveSettingsBtn: {
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveSettingsBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
