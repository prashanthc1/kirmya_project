# Kirmya Capacity Planning & Resource Scaling Guide

## 1. Resource Limits & Autoscaling Guidelines
- **API Pod Sizing**: 512MB RAM / 0.5 CPU requests, 1GB RAM / 1.0 CPU limits with horizontal autoscaling triggered at 75% CPU.
- **Database Connection Sizing**: Maximum 100 connections on `pgxpool` with 10 minimum idle connections.
- **Redis Memory Allocation**: 2GB maximum cache memory with `allkeys-lru` eviction policy.
