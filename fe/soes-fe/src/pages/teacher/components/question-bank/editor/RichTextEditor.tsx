import { Editor } from '@tinymce/tinymce-react'
import 'tinymce/tinymce'
import 'tinymce/models/dom'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/code'
import 'tinymce/plugins/codesample'
import 'tinymce/plugins/image'
import 'tinymce/plugins/link'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/table'
import 'tinymce/skins/ui/oxide/skin.min.css'
import contentUiCss from 'tinymce/skins/ui/oxide/content.min.css?raw'
import contentDefaultCss from 'tinymce/skins/content/default/content.min.css?raw'
import { useMemo } from 'react'
import { formatPlainTextToHtml } from '../../../utils/formatHtml.utils'
import type { Editor as TinyMCEEditor } from 'tinymce'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  height?: number
  onInit?: (editor: TinyMCEEditor) => void
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 240,
  height = 280,
  onInit,
}: RichTextEditorProps) {
  const normalizedValue = useMemo(() => formatPlainTextToHtml(value), [value])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-blue-500">
      <Editor
        licenseKey="gpl"
        value={normalizedValue}
        onEditorChange={onChange}
        onInit={(_, editor) => onInit?.(editor)}
        init={{
          skin: false,
          content_css: false,
          height,
          min_height: minHeight,
          menubar: false,
          branding: false,
          promotion: false,
          resize: true,
          object_resizing: true,
          resize_img_proportional: true,
          placeholder,
          plugins: 'advlist autolink code codesample image link lists table',
          toolbar:
            'undo redo | blocks | bold italic underline | bullist numlist | table image link codesample | code',
          images_upload_handler: async (blobInfo) => {
            return `data:${blobInfo.blob().type};base64,${blobInfo.base64()}`
          },
          automatic_uploads: true,
          paste_data_images: true,
          images_file_types: 'jpg,jpeg,png,webp,gif',
          content_style: [
            contentUiCss,
            contentDefaultCss,
            'body { font-family: Inter, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1f2937; margin: 12px; }',
            'img { display: inline-block; cursor: pointer; vertical-align: top; }',
            'p:has(> img:only-child) { display: inline-block; margin: 0 12px 12px 0; vertical-align: top; }',
            'p:has(> img:only-child) img { display: block; }',
            'pre { white-space: pre-wrap; }',
          ].join('\n'),
        }}
      />
    </div>
  )
}
