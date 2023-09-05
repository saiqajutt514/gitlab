export enum AuditLogListSort {
  moduleName = "audit_log.moduleName",
  entityName = "audit_log.entityName",
  entityId = "audit_log.entityId",
  actionType = "audit_log.actionType",
  createdAt = "audit_log.createdAt"
}

export enum SettingsSort {
  setting = "JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.category'))",
  subSetting = "JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.name'))",
  oldValue = "JSON_UNQUOTE(JSON_EXTRACT(audit_log.oldValues, '$.value'))",
  newValue = "JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.value'))",
}

export enum CaptainStatusSort {
  oldStatus = "JSON_UNQUOTE(JSON_EXTRACT(audit_log.oldValues, '$.approved'))",
  newStatus = "JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.approved'))",
  blockedReason = "JSON_UNQUOTE(JSON_EXTRACT(audit_log.newValues, '$.blockedReason'))",
}

export enum ChatUserStatusSort {
  oldStatus = "audit_log.oldValues->'$.status'",
  newStatus = "audit_log.newValues->'$.status'",
  reason = "audit_log.newValues->>'$.reason'",
}