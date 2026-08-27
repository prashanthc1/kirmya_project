# Kirmya Infrastructure Disaster Recovery & Host Failover

## 1. Network & Host Failover Infrastructure
- **Cloudflare Origin Shielding**: External traffic is proxied through Cloudflare WAF/CDN. In the event of primary host failure, DNS failover redirects traffic to the secondary standby host without exposing origin IP addresses.
- **Persistent Volume Protection**: PostgreSQL data directory (`/var/lib/postgresql/data`) and S3 media stores reside on persistent EBS/SAN storage volumes backed up via continuous automated snapshots.

---

## 2. Infrastructure Recovery Timeline (RTO <= 1 Hour)
1. **Host Outage Detected**: Automated Prometheus alert fires `HostDown`.
2. **DNS Shift**: Switch Cloudflare CNAME record to secondary standby endpoint.
3. **Volume Mount**: Attach persistent data volumes to secondary instance.
4. **Service Startup**: Execute `docker-compose -f docker-compose.production.yml up -d`.
5. **Health Verification**: Automated smoke tests confirm `/healthz` & `/api/v1/system/health` return HTTP 200 OK.
