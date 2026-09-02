import AppSelect from '../../../../components/common/AppSelect'
import TeacherToolbar from '../TeacherToolbar'

export default function QuestionBankToolbar({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  selectedType,
  onTypeChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedStatus,
  onStatusChange,
  onReset,
  subjects,
}: {
  searchQuery: string
  onSearchChange: (val: string) => void
  selectedSubject: string
  onSubjectChange: (val: string) => void
  selectedType: string
  onTypeChange: (val: string) => void
  selectedDifficulty: string
  onDifficultyChange: (val: string) => void
  selectedStatus: string
  onStatusChange: (val: string) => void
  onReset: () => void
  subjects?: Array<{ id: string; name: string }>
}) {
  return (
    <TeacherToolbar
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm nội dung câu hỏi..."
      onReset={onReset}
      filters={
        <>
          <AppSelect
            value={selectedSubject}
            onChange={onSubjectChange}
            className="w-52"
            options={[
              { value: 'ALL', label: 'Tất cả môn học' },
              ...(subjects && subjects.length > 0
                ? subjects.map((s) => ({ value: s.id, label: s.name }))
                : [
                    { value: 'sub-01', label: 'Lập trình Java căn bản' },
                    { value: 'sub-02', label: 'Cấu trúc dữ liệu & GT' },
                    { value: 'sub-03', label: 'Lập trình C++' },
                    { value: 'sub-04', label: 'Cơ sở dữ liệu' },
                  ]),
            ]}
          />
          <AppSelect
            value={selectedType}
            onChange={onTypeChange}
            className="w-48"
            options={[
              { value: 'ALL', label: 'Tất cả dạng câu' },
              { value: 'SINGLE_CHOICE', label: 'Trắc nghiệm 1 đáp án' },
              { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm nhiều đáp án' },
              { value: 'TRUE_FALSE', label: 'Đúng / Sai' },
              { value: 'PROGRAMMING', label: 'Lập trình (Code)' },
            ]}
          />
          <AppSelect
            value={selectedDifficulty}
            onChange={onDifficultyChange}
            className="w-36"
            options={[
              { value: 'ALL', label: 'Mọi độ khó' },
              { value: 'EASY', label: 'Dễ' },
              { value: 'MEDIUM', label: 'Trung bình' },
              { value: 'HARD', label: 'Khó' },
            ]}
          />
          <AppSelect
            value={selectedStatus}
            onChange={onStatusChange}
            className="w-44"
            options={[
              { value: 'ALL', label: 'Trạng thái duyệt' },
              { value: 'APPROVED', label: 'Đã duyệt' },
              { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
              { value: 'PRIVATE', label: 'Cá nhân' },
              { value: 'REJECTED', label: 'Bị từ chối' },
              { value: 'ARCHIVED', label: 'Đã lưu trữ' },
            ]}
          />
        </>
      }
    />
  )
}
