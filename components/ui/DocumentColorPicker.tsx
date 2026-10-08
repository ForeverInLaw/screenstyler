'use client';
import { useDocumentEdit } from '@/lib/editor/use-document-edit';
import { ColorPicker, type ColorPickerProps } from './ColorPicker';

export function DocumentColorPicker(props: Omit<ColorPickerProps, 'onInteractionStart' | 'onInteractionEnd'>) {
  const edit = useDocumentEdit();
  return <ColorPicker {...props} onInteractionStart={edit.begin} onInteractionEnd={edit.commit} />;
}
