import React, { useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
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
import { Icon } from '../../ui/Icon.js';
import { noOutlineStyle } from '../../ui/AppleInput.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** When the message was sent, epoch ms; shown as a local clock time. */
  sentAt: number;
  /** Answered by the built-in coach because the AI backend was unreachable. */
  isOfflineAnswer?: boolean;
}

interface CoachChatScreenProps {
  context: CoachContext;
  onBack: () => void;
}

// Starter questions differ by market; the ids are stable and the text is translated.
const CHIP_IDS = ['one', 'two', 'three', 'four'];

export const CoachChatScreen: React.FC<CoachChatScreenProps> = ({
  context,
  onBack,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const { language } = useI18nState();
  // Clock time in the app language (Arabic digits and order for ar).
  const formatTime = (sentAt: number) =>
    new Date(sentAt).toLocaleTimeString(language, { hour: 'numeric', minute: '2-digit' });
  const dir = useTextDirection();
  const chatRegion = context.region || activeRegion;
  const isSaudi = chatRegion === 'SA';
  const chips = CHIP_IDS.map((id) => t(`coach.chips.${id}.${chatRegion}`));
  const accentColor = theme.colors.primaryLime;

  const initialGreeting = t(`coach.greeting.${chatRegion}`, {
    name: context.displayName || t('coach.defaultName'),
    remaining: context.todaySummary?.remainingCalories ?? context.targets.kcalTarget,
  });

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      role: 'assistant',
      text: initialGreeting,
      sentAt: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [suggestedChips, setSuggestedChips] = useState<string[]>(chips);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      sentAt: Date.now(),
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
        sentAt: Date.now(),
        isOfflineAnswer: response.providerUsed === 'deterministic_fallback',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.suggestedPrompts && response.suggestedPrompts.length > 0) {
        setSuggestedChips(response.suggestedPrompts);
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: t(`coach.connectionError.${chatRegion}`),
        sentAt: Date.now(),
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
            <Icon name={dir.isRTL ? 'arrow-right' : 'arrow-left'} size={14} color={theme.colors.textPrimary} />
            <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>{t('common.back')}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Icon name="sparkles" size={16} color={isDark ? theme.colors.primaryLime : '#4B6200'} />
            <Text style={[styles.headerTitle, dir.text, { color: theme.colors.textPrimary }]}>
              {t('coach.title')}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            {t(`coach.calibrated.${chatRegion}`)}
          </Text>
        </View>

        {/* Market badge; also balances the back button so the title stays centred. */}
        <View
          style={[
            styles.headerRightBadge,
            {
              backgroundColor: isSaudi
                ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                : (isDark ? 'rgba(164, 235, 63, 0.15)' : '#F7FEE7'),
              borderColor: accentColor,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: isDark ? theme.colors.primaryLime : '#4B6200' }]}>
            {chatRegion}
          </Text>
        </View>
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
                m.role === 'user'
                  ? [styles.userBubble, { backgroundColor: accentColor }]
                  : styles.assistantBubble,
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
                  {t('coach.badge')}
                </Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  m.role === 'user'
                    ? [styles.userText, { color: '#0A0B0D' }]
                    : [styles.assistantText, { color: theme.colors.textPrimary }],
                ]}
              >
                {m.text}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  {
                    color: m.role === 'user'
                      ? '#333A00'
                      : theme.colors.textMuted,
                  },
                ]}
              >
                {m.isOfflineAnswer
                  ? `${t('coach.offlineAnswer')} · ${formatTime(m.sentAt)}`
                  : formatTime(m.sentAt)}
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
                {t('coach.typing')}
              </Text>
            </View>
          )}

          {/* Suggested Prompts Chips */}
          <View style={styles.chipsSection}>
            <Text style={[styles.chipsHeader, { color: theme.colors.textMuted }]}>
              {t('coach.suggestedTopics')}
            </Text>
            <View style={styles.chipsWrap}>
              {chips.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.colors.surfaceSecondary,
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
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder={
              t(`coach.inputPlaceholder.${chatRegion}`)
            }
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: accentColor },
              (!inputText.trim() || isTyping) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.8}
          >
            <Icon name="arrow-up" size={20} color="#0A0B0D" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    borderWidth: 1.5,
    ...noOutlineStyle,
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
});
