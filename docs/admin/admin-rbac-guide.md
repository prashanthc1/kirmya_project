# Kirmya Admin RBAC & Granular Permission Matrix Manual

## 1. Administrative Role Matrix
| Permission | Super Admin | Trust & Safety Admin | Content Moderator | Support Admin | Compliance Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `user.ban` | Yes | Yes | No | No | No |
| `content.moderate` | Yes | Yes | Yes | No | No |
| `report.review` | Yes | Yes | Yes | Yes | No |
| `audit.read` | Yes | Yes | No | No | Yes |
| `settings.manage` | Yes | No | No | No | No |
| `dsr.execute` | Yes | No | No | No | Yes |
