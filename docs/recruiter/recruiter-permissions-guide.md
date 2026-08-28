# Kirmya Recruiter Role Permissions & Granular Access Control Guide

## 1. Role Capabilities & Granular Permission Scopes
| Permission Key | Org Owner | Recruiter Admin | Hiring Manager | Recruiter | Interviewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `org.manage` | Yes | Yes | No | No | No |
| `team.invite` | Yes | Yes | No | No | No |
| `jobs.create` | Yes | Yes | Assigned Only | Yes | No |
| `candidate.view` | Yes | Yes | Assigned Only | Yes | Assigned Only |
| `pipeline.update`| Yes | Yes | Assigned Only | Yes | No |
| `interview.note` | Yes | Yes | Assigned Only | Yes | Yes |
