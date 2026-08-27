# Kirmya Job Domain Architecture & Entity Lifecycles

## 1. Domain Lifecycles & State Transitions

### Job Post Lifecycle
```
[Draft] -> [Pending Review] -> [Published] -> [Paused] -> [Closed] -> [Archived]
```

### Application Lifecycle
```
[Submitted] -> [Screening] -> [Shortlisted] -> [Interview] -> [Offer] -> [Hired / Rejected / Withdrawn]
```
