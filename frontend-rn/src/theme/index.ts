import { Dimensions } from 'react-native';

// 原项目按 750 宽设计稿写 rpx，这里按屏幕宽度等比换算，保持和原页面一致的比例
const SCREEN_WIDTH = Dimensions.get('window').width;

export function rpx(value: number): number {
  return (value * SCREEN_WIDTH) / 750;
}

export const colors = {
  primary: '#3A6341',
  primaryLight: '#4E7D56',
  navBar: '#375f3e',
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  placeholder: '#bbbbbb',
  border: '#f0f0f0',
  price: '#e74c3c',
  tabInactive: '#676767',
} as const;

// RN 0.88 原生支持 CSS 渐变字符串
export const primaryGradient = 'linear-gradient(135deg, #3A6341, #4E7D56)';
