import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { uploadImage } from '@/api/item';
import { ImagePreview } from '@/components/ImagePreview';
import { colors, rpx } from '@/theme';

// 表单里的一张图：本地刚选的只有 uri；已上传过的带 remoteUrl（后端返回的 /uploads/... 路径）
export interface ImageEntry {
  uri: string;
  remoteUrl?: string;
  fileName?: string | null;
  mimeType?: string | null;
}

// 提交前把本地图片逐张上传，已上传过的直接用原地址（对应原页面 img.includes('/uploads/') 的判断）
export async function uploadEntries(entries: ImageEntry[]): Promise<string[]> {
  const urls: string[] = [];
  for (const entry of entries) {
    urls.push(entry.remoteUrl ?? (await uploadImage(entry)));
  }
  return urls;
}

interface ImageUploaderProps {
  images: ImageEntry[];
  onChange: (images: ImageEntry[]) => void;
  max?: number;
}

// 九宫格选图：点 + 选图，点图预览，右上角 ✕ 删除
export function ImageUploader({ images, onChange, max = 9 }: ImageUploaderProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: max - images.length,
      // 对应 uni.chooseImage 默认的压缩图
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked = result.assets.map((a) => ({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType }));
    onChange([...images, ...picked].slice(0, max));
  }

  return (
    <View style={styles.grid}>
      {images.map((img, idx) => (
        <Pressable key={img.uri + idx} style={styles.item} onPress={() => setPreviewIndex(idx)}>
          <Image style={styles.thumb} source={img.uri} contentFit="cover" />
          <Pressable style={styles.remove} hitSlop={6} onPress={() => onChange(images.filter((_, i) => i !== idx))}>
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        </Pressable>
      ))}
      {images.length < max && (
        <Pressable style={styles.uploadBox} onPress={pick}>
          <Text style={styles.uploadIcon}>+</Text>
          <Text style={styles.uploadText}>添加图片</Text>
        </Pressable>
      )}
      <ImagePreview urls={images.map((i) => i.uri)} index={previewIndex} onClose={() => setPreviewIndex(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: rpx(16) },
  item: { width: rpx(160), height: rpx(160), borderRadius: rpx(16), overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: rpx(44),
    height: rpx(44),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: rpx(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: colors.white, fontSize: rpx(24) },
  uploadBox: {
    width: rpx(160),
    height: rpx(160),
    borderWidth: rpx(2),
    borderStyle: 'dashed',
    borderColor: '#dddddd',
    borderRadius: rpx(16),
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: { fontSize: rpx(48), lineHeight: rpx(52), color: '#cccccc' },
  uploadText: { fontSize: rpx(22), color: colors.textMuted, marginTop: rpx(8) },
});
