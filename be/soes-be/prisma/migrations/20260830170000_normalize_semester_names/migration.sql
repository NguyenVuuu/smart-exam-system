UPDATE "Semester"
SET "name" = 'Học kỳ '
  || CASE "term"
    WHEN 'TERM_1' THEN '1'
    WHEN 'TERM_2' THEN '2'
    WHEN 'TERM_3' THEN '3'
  END
  || ' - '
  || REPLACE("academicYear", '-', '/');
