import AppSelect, { type AppSelectProps } from '../../../components/common/AppSelect'

export default function AdminSelect<T extends string | number = string>(props: AppSelectProps<T>) {
  return <AppSelect {...props} accent="emerald" />
}
