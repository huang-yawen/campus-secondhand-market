import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, rpx } from '@/theme';

interface ImagePreviewProps {
  // 已经是完整地址（调用方先 resolveImageUrl）
  urls: string[];
  // null 表示关闭
  index: number | null;
  onClose: () => void;
}

// 全屏图片预览，替代 uni.previewImage：左右滑动切换，点击关闭
export function ImagePreview({ urls, index, onClose }: ImagePreviewProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  return (
    <Modal visible={index !== null} transparent animationType="fade" onRequestClose={onClose} onShow={() => setCurrent(index ?? 0)}>
      <FlatList
        style={styles.bg}
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index ?? 0}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={(url, i) => url + i}
        renderItem={({ item }) => (
          <Pressable style={{ width, height }} onPress={onClose}>
            <Image style={styles.img} source={item} contentFit="contain" />
          </Pressable>
        )}
      />
      {urls.length > 1 && (
        <Text style={[styles.counter, { top: insets.top + rpx(20) }]}>
          {current + 1} / {urls.length}
        </Text>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  img: { flex: 1 },
  counter: { position: 'absolute', alignSelf: 'center', color: colors.white, fontSize: rpx(28) },
});
