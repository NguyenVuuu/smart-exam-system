DELETE FROM "AdminPermissionOverride" AS view_override
USING "AdminPermissionOverride" AS manage_override,
      (VALUES
        ('ACADEMIC_MANAGE', 'ACADEMIC_VIEW'),
        ('USERS_MANAGE', 'USERS_VIEW'),
        ('QUESTION_BANK_MANAGE', 'QUESTION_BANK_VIEW'),
        ('SCHEDULES_MANAGE', 'SCHEDULES_VIEW'),
        ('SETTINGS_MANAGE', 'SETTINGS_VIEW')
      ) AS dependency(manage_permission, view_permission)
WHERE view_override."adminId" = manage_override."adminId"
  AND view_override."permission" = dependency.view_permission
  AND view_override."allowed" = TRUE
  AND manage_override."permission" = dependency.manage_permission
  AND manage_override."allowed" = TRUE
  AND (
    SELECT log.metadata ->> 'requestedPermission'
    FROM "AuditLog" AS log
    WHERE log."entityType" = 'AdminPermissionOverride'
      AND log."entityId" = view_override."adminId"
      AND log.metadata ->> 'permission' = view_override."permission"
    ORDER BY log."createdAt" DESC, log."id" DESC
    LIMIT 1
  ) = dependency.manage_permission;
