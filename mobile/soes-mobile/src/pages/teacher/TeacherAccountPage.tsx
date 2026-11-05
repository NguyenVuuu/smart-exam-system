import { ScrollView, StyleSheet, View } from 'react-native'
import { TeacherPasswordForm } from '../../components/teacher/account/TeacherPasswordForm'
import { TeacherProfileForm } from '../../components/teacher/account/TeacherProfileForm'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { useTeacherAccount } from '../../hooks/useTeacherAccount'

export function TeacherAccountPage() {
  const account = useTeacherAccount()
  return <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenHeader title="Tài khoản" description="Thông tin liên hệ và bảo mật tài khoản" />
    <View style={styles.section}><TeacherProfileForm user={account.user} email={account.email} phone={account.phone} busy={account.busy}
      onEmail={account.setEmail} onPhone={account.setPhone} onSave={() => { void account.saveProfile() }} /></View>
    <View style={styles.section}><TeacherPasswordForm current={account.currentPassword} next={account.newPassword} confirm={account.confirmPassword}
      busy={account.busy} onCurrent={account.setCurrentPassword} onNext={account.setNewPassword}
      onConfirm={account.setConfirmPassword} onSave={() => { void account.changePassword() }} /></View>
  </ScrollView>
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { padding: 16, paddingBottom: 36 }, section: { marginTop: 12 } })
