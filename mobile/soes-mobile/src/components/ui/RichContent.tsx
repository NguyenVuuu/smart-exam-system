import RenderHtml from '@native-html/render'
import { useWindowDimensions } from 'react-native'

function asHtml(content: string) {
  if (/<[a-z][\s\S]*?>/i.test(content)) return content
  return content.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('\n', '<br/>')
}

export function RichContent({ content }: { content: string }) {
  const { width } = useWindowDimensions()
  return <RenderHtml contentWidth={Math.max(1, width - 72)} source={{ html: asHtml(content) }}
    baseStyle={{ color: '#334155', fontSize: 14, lineHeight: 21 }} />
}
