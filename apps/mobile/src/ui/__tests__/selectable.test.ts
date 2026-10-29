import { describe, expect, it } from 'vitest';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { OptionButton, OptionGroup, optionA11y } from '../Selectable.js';
import { AuthScreen } from '../../auth/ui/AuthScreen.js';
import { authFieldForKey, validateAuthFields } from '../../auth/authErrors.js';

// AuthScreen requires its logo image; Node cannot parse a .webp, so give it a stand-in.
(Module as unknown as { _extensions: Record<string, (m: { exports: unknown }) => void> })._extensions['.webp'] = (m) => {
  m.exports = { uri: 'logo.webp' };
};

initI18n('en');
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const noop = () => {};

describe('option roles', () => {
  it('a single choice is a radio with aria-checked, a multi choice a button with aria-pressed', () => {
    expect(optionA11y('radio', true)).toMatchObject({ accessibilityRole: 'radio', 'aria-checked': true });
    expect(optionA11y('toggle', false)).toMatchObject({ accessibilityRole: 'button', 'aria-pressed': false });
    expect(optionA11y('radio', false)).not.toHaveProperty('aria-selected');
    expect(optionA11y('toggle', true)).not.toHaveProperty('aria-selected');
  });

  it('renders a radiogroup of radios and never aria-selected on a button', () => {
    const html = render(
      React.createElement(
        OptionGroup,
        { label: 'Goal' },
        React.createElement(OptionButton, { label: 'Lose fat', selected: true, onPress: noop }),
        React.createElement(OptionButton, { label: 'Build muscle', selected: false, onPress: noop })
      )
    );
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/role="radio"/g)?.length).toBe(2);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-checked="false"');
    expect(html).not.toContain('aria-selected');
  });

  it('renders pick-any options as pressed buttons in a group', () => {
    const html = render(
      React.createElement(
        OptionGroup,
        { label: 'Focus', mode: 'toggle' },
        React.createElement(OptionButton, { label: 'Core', selected: true, onPress: noop, mode: 'toggle' })
      )
    );
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('aria-selected');
  });

  it('keeps the same width when selected: the label weight does not change', () => {
    const off = render(React.createElement(OptionButton, { label: 'Gym', selected: false, onPress: noop }));
    const on = render(React.createElement(OptionButton, { label: 'Gym', selected: true, onPress: noop }));
    const weight = (html: string) => html.match(/font-weight:([0-9a-z]+)/)?.[1];
    expect(weight(on)).toBe(weight(off));
  });
});

describe('auth form', () => {
  it('checks fields before sending and says which one is wrong', () => {
    expect(validateAuthFields('register', { name: ' ', email: 'nope', password: '123' })).toEqual({
      name: 'auth.errors.nameRequired',
      email: 'auth.errors.emailRequired',
      password: 'auth.errors.passwordTooShort',
    });
    expect(validateAuthFields('register', { name: 'Sara', email: 'sara@x.com', password: '123456' })).toEqual({});
    expect(validateAuthFields('login', { name: '', email: 'sara@x.com', password: '' })).toEqual({ password: 'auth.errors.passwordRequired' });
    expect(authFieldForKey('auth.errors.alreadyRegistered')).toBeUndefined();
    expect(authFieldForKey('auth.errors.passwordTooShort')).toBe('password');
  });

  it('renders the tabs as role=tab with aria-selected and the actions as buttons', () => {
    const html = render(React.createElement(AuthScreen, { onAuthSuccess: noop, onExploreGuest: noop }));
    expect(html.match(/role="tab"/g)?.length).toBe(2);
    expect(html).toContain('aria-selected="true"');
    expect(html).toMatch(/<button[^>]*>/);
  });
});
