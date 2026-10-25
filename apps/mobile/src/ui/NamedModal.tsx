import React from 'react';
import { Modal, ModalProps } from 'react-native';

interface NamedModalProps extends ModalProps {
  /** What a screen reader announces when the dialog opens. */
  accessibilityName: string;
}

/**
 * react-native-web renders Modal as a role="dialog" element and forwards extra
 * props to it, so an aria-label there is the dialog's accessible name. Native
 * ignores the prop; there the dialog is named by its own heading.
 */
export const NamedModal: React.FC<NamedModalProps> = ({ accessibilityName, ...rest }) => {
  const nameProps = { 'aria-label': accessibilityName } as Record<string, string>;
  return <Modal {...rest} {...nameProps} />;
};
