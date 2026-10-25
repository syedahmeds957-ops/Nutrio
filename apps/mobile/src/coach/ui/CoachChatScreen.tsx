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
import type { CoachSwapResult, CoachSwapTopic } from '../../workout/coachWorkout.js';
import { ApplySwapCard, type SwapCardState } from './ApplySwapCard.js';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** When the message was sent, epoch ms; shown as a local clock time. */
  sentAt: number;
  /** Answered by the built-in coach because the AI backend was unreachable. */
  isOfflineAnswer?: boolean;
  /** A swap the coach proposed in this answer; 'kept' hides the card. */
  swap?: { topic: CoachSwapTopic; toId: string; state: SwapCardState | 'kept'; dayTitle?: string };
}

interface CoachChatScreenProps {
  context: CoachContext;
  onBack: () => void;
  /** The exercise the user asked about ("Ask coach about this"), sent with each message until closed. */
  swapTopic?: CoachSwapTopic | null;
  /** Applies a proposed swap the user accepted; refused when the plan no longer allows it. */
  onApplySwap?: (topic: CoachSwapTopic, toId: string) => CoachSwapResult;
}

/**
 * Adds a coach answer. A new proposal replaces any earlier one the user hasn't
 * answered (the model sometimes proposes before the user agrees, then again
 * after), so only one card is live.
 */
export function appendCoachMessage(messages: readonly Message[], next: Message): Message[] {
  const earlier = next.swap
    ? messages.map((m) => (m.swap?.state === 'proposed' ? { ...m, swap: { ...m.swap, state: 'kept' as const } } : m))
    : messages;
  return [...earlier, next];
}

// Starter questions differ by market; the ids are stable and the text is translated.
const CHIP_IDS = ['one', 'two', 'three', 'four'];

export const CoachChatScreen: React.FC<CoachChatScreenProps> = ({
  context,
  onBack,
  swapTopic,
  onApplySwap,
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
  const [topic, setTopic] = useState<CoachSwapTopic | null>(swapTopic ?? null);
  const scrollViewRef = useRef<ScrollView>(null);
  // Only the newest proposal can be applied; older cards stay for the record.
  const latestProposalId = [...messages].reverse().find((m) => m.swap)?.id;

  const setSwapState = (id: string, swap: Partial<NonNullable<Message['swap']>>) =>
    setMessages((prev) => prev.map((m) => (m.id === id && m.swap ? { ...m, swap: { ...m.swap, ...swap } } : m)));

  const applySwap = (m: Message) => {
    if (!m.swap || !onApplySwap) return;
    const result = onApplySwap(m.swap.topic, m.swap.toId);
    if (result.applied) {
      setSwapState(m.id, { state: 'applied', dayTitle: result.dayTitle });
      // The chat is now about the exercise in the slot, with its own safe swaps.
      setTopic(result.topic);
    } else {
      setSwapState(m.id, { state: 'refused' });
    }
  };

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
      const askedAbout = topic;
      const response = await sendCoachMessage(
        newMessages.map((m) => ({
          role: m.role,
          content: m.text,
        })),
        context,
        undefined,
        askedAbout
          ? { exerciseId: askedAbout.exerciseId, exerciseName: askedAbout.exerciseName, candidates: askedAbout.candidates }
          : undefined
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.reply,
        sentAt: Date.now(),
        isOfflineAnswer: response.providerUsed === 'deterministic_fallback',
        ...(askedAbout && response.proposedSwap
          ? { swap: { topic: askedAbout, toId: response.proposedSwap.toId, state: 'proposed' as const } }
          : {}),
      };

      setMessages((prev) => appendCoachMessage(prev, assistantMsg));
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
            <Icon name="arrow-left" size={14} color={theme.colors.textPrimary} />
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

      {topic ? (
        <View style={styles.topicWrap}>
          <View style={[styles.topicChip, { backgroundColor: theme.colors.surfaceSecondary }]}>
            <Icon name="dumbbell" size={16} color={theme.colors.textPrimary} />
            <Text numberOfLines={1} style={[styles.topicText, dir.text, { color: theme.colors.textPrimary }]}>
              {t('coach.topic.talkingAbout')}: <Text style={styles.topicName}>{topic.exerciseName}</Text>
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('coach.topic.remove')}
              onPress={() => setTopic(null)}
              style={styles.topicClose}
            >
              <Icon name="x" size={16} color={theme.colors.textSecondary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
            <React.Fragment key={m.id}>
              <View
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
              {m.swap && m.swap.state !== 'kept' ? (
                <ApplySwapCard
                  fromId={m.swap.topic.exerciseId}
                  toId={m.swap.toId}
                  state={m.swap.state}
                  dayTitle={m.swap.dayTitle}
                  onApply={m.id === latestProposalId && m.swap.state === 'proposed' ? () => applySwap(m) : undefined}
                  onKeep={m.id === latestProposalId && m.swap.state === 'proposed' ? () => setSwapState(m.id, { state: 'kept' }) : undefined}
                />
              ) : null}
            </React.Fragment>
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
  topicWrap: { paddingHorizontal: 16, paddingTop: 8 },
  topicChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingStart: 12, borderRadius: 999 },
  topicText: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: '600' },
  topicName: { fontWeight: '800' },
  topicClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
