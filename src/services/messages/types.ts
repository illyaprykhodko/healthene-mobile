export const MESSAGE_TYPES = {
    META: '@messages/META',
    CLEAR: '@messages/CLEAR',
    ADD: '@messages/ADD',
    REMOVE: '@messages/REMOVE',
} as const;

export interface Message {
  uid?: string;
  message: string;
  title: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  toast?: ((message: string) => void) | {
    position?: 'top' | 'bottom';
    visibilityTime?: number;
    autoHide?: boolean;
    topOffset?: number;
    bottomOffset?: number;
  };
  debugCode?: string;
  explanation?: string | null;
  okText?: string;
  cancelText?: string;
  defaultValue?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export interface MessagesState {
  list: Message[];
}
