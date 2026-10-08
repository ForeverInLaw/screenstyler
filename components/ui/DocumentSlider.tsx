'use client';
import { useDocumentEdit } from '@/lib/editor/use-document-edit';
import { Slider, type SliderProps } from './Slider';

/** Dragging a document control records one undo step when released. */
export function DocumentSlider(props: Omit<SliderProps, 'onInteractionStart' | 'onInteractionEnd'>) {
  const edit = useDocumentEdit();
  return (
    <Slider {...props} onInteractionStart={edit.begin} onInteractionEnd={edit.commit} />
  );
}
