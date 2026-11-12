import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickedFile, pickFromGallery, pickPdf, takePhoto } from '@/lib/files';
import { fmtDate, isoDate, parseIsoDate } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import { Button, styles as ui } from './ui';

export function Select<T extends { id: number; name: string }>({
  label, required, options, value, onChange, placeholder = 'Select…',
}: {
  label: string; required?: boolean; options: T[]; value: number | null; onChange: (item: T) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.id === value);
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.name ?? 'not selected'}`}
        onPress={() => setOpen(true)}
        style={[ui.input, s.selectRow]}
      >
        <Text style={{ fontSize: 16, color: selected ? colors.ink : colors.faint, flex: 1 }}>{selected?.name ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <Text style={s.sheetTitle}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => String(o.id)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { onChange(item); setOpen(false); }}
                style={({ pressed }) => [s.option, pressed && { backgroundColor: colors.bg }]}
              >
                <Text style={{ fontSize: 16, color: colors.ink, flex: 1 }}>{item.name}</Text>
                {item.id === value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

export function DateField({
  label, required, value, onChange, minimumDate, maximumDate,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; minimumDate?: Date; maximumDate?: Date;
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(parseIsoDate(value));
  const insets = useSafeAreaInsets();

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseIsoDate(value),
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(isoDate(date));
        },
      });
    } else {
      setDraft(parseIsoDate(value));
      setIosOpen(true);
    }
  };

  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={ui.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${fmtDate(value)}`} onPress={open} style={[ui.input, s.selectRow]}>
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
        <Text style={{ fontSize: 16, color: colors.ink, flex: 1 }}>{fmtDate(value)}</Text>
      </Pressable>
      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={s.backdrop} onPress={() => setIosOpen(false)} />
          <View style={[s.sheet, { paddingBottom: insets.bottom + space.md }]}>
            <DateTimePicker
              value={draft}
              mode="date"
              display="inline"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_, d) => d && setDraft(d)}
              accentColor={colors.primary}
            />
            <Button title="Done" onPress={() => { onChange(isoDate(draft)); setIosOpen(false); }} style={{ marginHorizontal: space.lg }} />
          </View>
        </Modal>
      )}
    </View>
  );
}

export function AttachmentPicker({
  files, onChange, label = 'Bills / receipts', required, allowMultiple = true,
}: { files: PickedFile[]; onChange: (f: PickedFile[]) => void; label?: string; required?: boolean; allowMultiple?: boolean }) {
  const [busy, setBusy] = useState(false);
  const add = async (fn: () => Promise<PickedFile[]>) => {
    setBusy(true);
    try {
      const picked = await fn();
      if (picked.length) onChange(allowMultiple ? [...files, ...picked] : picked.slice(0, 1));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Camera" icon="camera-outline" variant="secondary" onPress={() => add(takePhoto)} disabled={busy} style={{ flex: 1, paddingHorizontal: 8 }} />
        <Button title="Gallery" icon="images-outline" variant="secondary" onPress={() => add(pickFromGallery)} disabled={busy} style={{ flex: 1, paddingHorizontal: 8 }} />
        <Button title="PDF" icon="document-outline" variant="secondary" onPress={() => add(() => pickPdf(allowMultiple))} disabled={busy} style={{ flex: 1, paddingHorizontal: 8 }} />
      </View>
      {files.map((f, i) => (
        <View key={`${f.uri}-${i}`} style={s.fileRow}>
          <Ionicons name={f.mimeType === 'application/pdf' ? 'document-text' : 'image'} size={20} color={colors.primary} />
          <Text style={{ flex: 1, color: colors.ink }} numberOfLines={1}>{f.name}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${f.name}`}
            hitSlop={12}
            onPress={() => onChange(files.filter((_, j) => j !== i))}
          >
            <Ionicons name="close-circle" size={22} color={colors.faint} />
          </Pressable>
        </View>
      ))}
      <Text style={ui.hint}>Photos are compressed automatically for fast upload. Max 10 MB per file.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    paddingTop: space.lg, maxHeight: '75%', gap: space.sm,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, paddingHorizontal: space.lg, paddingBottom: space.sm },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: 14, minHeight: 48 },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
});
