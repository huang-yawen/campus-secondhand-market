import { Text, type StyleProp, type TextStyle } from 'react-native';

import { colors } from '@/theme';

// 码点来自原项目 static/iconfont/iconfont.json，字体文件为 assets/fonts/iconfont.ttf
const glyphs = {
  wuxiaoxi: 0xe615,
  weizhaodao: 0xe661,
  saying: 0xe62f,
  yuyin: 0xe6e0,
  shoucang: 0xe613,
  xinyuandan: 0xe663,
  xz: 0xe603,
  jianpan: 0xe60e,
  xiaoxi: 0xe87c,
  huatong: 0xe67e,
  'wode-copy': 0xe600,
  bianji: 0xe67c,
  xiaoxi2: 0xe601,
  wodeqiugou: 0xe63d,
  remenqiugou: 0xe64b,
  'fabu-': 0xe66c,
  'fabudianjizhuangtai-': 0xe68f,
  shouye: 0xe609,
  wode: 0xe60b,
  sousuo: 0xe60d,
  shouye1: 0xe602,
  fabu: 0xe60c,
} as const;

export type IconName = keyof typeof glyphs;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 16, color = colors.text, style }: IconProps) {
  return (
    <Text style={[{ fontFamily: 'iconfont', fontSize: size, lineHeight: size, color }, style]}>
      {String.fromCharCode(glyphs[name])}
    </Text>
  );
}
