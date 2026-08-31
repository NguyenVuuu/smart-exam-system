-- Keep semester codes deterministic across seeded and newly created records.
UPDATE "Semester"
SET "code" = 'HK'
  || substring("term"::text from '[0-9]+$')
  || '_'
  || replace("academicYear", '-', '_');
