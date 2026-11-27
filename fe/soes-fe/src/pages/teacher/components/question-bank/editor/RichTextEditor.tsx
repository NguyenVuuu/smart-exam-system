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
            'body { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; color: #334155; margin: 12px; }',
            'h1, h2, h3, h4, h5, h6 { font-family: inherit; color: #0f172a; margin-top: 14px; margin-bottom: 6px; font-weight: 600; }',
            'h3 { font-size: 14px; color: #1e40af; border-left: 3px solid #3b82f6; padding-left: 8px; margin-top: 14px; margin-bottom: 6px; }',
            'h4 { font-size: 13.5px; color: #1e293b; margin-top: 10px; margin-bottom: 4px; }',
            'p { margin: 6px 0; font-size: 13.5px; line-height: 1.6; color: #334155; font-weight: 400; }',
            'ul, ol { margin: 6px 0 10px 22px; padding: 0; }',
            'li { margin-bottom: 4px; font-size: 13.5px; line-height: 1.6; color: #334155; font-weight: 400; }',
            'pre { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin: 8px 0; font-family: Consolas, Monaco, "Courier New", monospace; font-size: 13px; line-height: 1.5; color: #0f172a; white-space: pre-wrap; }',
            'code { font-family: Consolas, Monaco, "Courier New", monospace; background-color: #f1f5f9; padding: 1px 4px; border-radius: 4px; font-size: 12.5px; color: #0f172a; }',
            'img { display: inline-block; cursor: pointer; vertical-align: top; }',
            'p:has(> img:only-child) { display: inline-block; margin: 0 12px 12px 0; vertical-align: top; }',
            'p:has(> img:only-child) img { display: block; }',
          ].join('\n'),
        }}
      />
    </div>
  )
}
