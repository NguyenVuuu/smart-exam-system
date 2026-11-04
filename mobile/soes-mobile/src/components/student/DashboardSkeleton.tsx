import { View } from 'react-native'

function Box({ style }: { style?: object }) {
  return (
    <View style={[{
      backgroundColor: '#f1f5f9', borderRadius: 14,
    }, style]} />
  )
}

export default function DashboardSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      <Box style={{ height: 36, width: 220 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[0,1,2,3].map(i => <Box key={i} style={{ height: 72, flex: 1, minWidth: 130 }} />)}
      </View>
      <Box style={{ height: 220 }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Box style={{ height: 140, flex: 1 }} />
        <Box style={{ height: 140, flex: 1 }} />
      </View>
    </View>
  )
}
