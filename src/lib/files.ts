import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

const MAX_BYTES = 10 * 1024 * 1024;

/** Resize to max 1600px and re-encode as JPEG so bills upload quickly on mobile data. */
async function compressImage(asset: ImagePicker.ImagePickerAsset, index: number): Promise<PickedFile> {
  const longest = Math.max(asset.width ?? 0, asset.height ?? 0);
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (longest > 1600) {
    if ((asset.width ?? 0) >= (asset.height ?? 0)) ctx.resize({ width: 1600 });
    else ctx.resize({ height: 1600 });
  }
  const rendered = await ctx.renderAsync();
  const out = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  const base = (asset.fileName ?? `receipt_${Date.now()}_${index}`).replace(/\.[^.]+$/, '');
  return { uri: out.uri, name: `${base}.jpg`, mimeType: 'image/jpeg' };
}

export async function takePhoto(): Promise<PickedFile[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph your bills.');
    return [];
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled) return [];
  return Promise.all(result.assets.map(compressImage));
}

export async function pickFromGallery(): Promise<PickedFile[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 1,
  });
  if (result.canceled) return [];
  return Promise.all(result.assets.map(compressImage));
}

export async function pickPdf(multiple = true): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    multiple,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  const files: PickedFile[] = [];
  for (const a of result.assets) {
    if (a.size && a.size > MAX_BYTES) {
      Alert.alert('File too large', `${a.name} is larger than 10 MB.`);
      continue;
    }
    files.push({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf', size: a.size });
  }
  return files;
}

/** Appends picked files to multipart form data as expo-file-system File objects. */
export function appendFiles(form: FormData, field: string, files: PickedFile[]) {
  for (const f of files) {
    form.append(field, new File(f.uri) as any);
  }
}
