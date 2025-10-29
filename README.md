# Uptime Monitor

A complete, functional uptime monitoring web application built with Convex, React, and TypeScript. Monitor your websites and APIs in real-time with automated checks, detailed metrics, and instant refresh capabilities.

## Features

### Core Functionality
- **Real-time Monitoring**: Automated uptime checks every 60 seconds
- **Instant Refresh**: Trigger immediate checks for any monitor
- **Multi-user Support**: Each user manages their own monitors with authentication
- **Comprehensive Metrics**: Track uptime percentage, response times, and status codes
- **Live Dashboard**: Real-time updates without manual refresh
- **Historical Data**: Store and display check history with visual indicators
- **Simple Status**: Clean UP/DOWN states (errors treated as DOWN)

### Monitoring Capabilities
- **HTTP/HTTPS Support**: Monitor any web endpoint
- **Custom Intervals**: Configurable check frequencies (default: 60 seconds)
- **Status Detection**: UP/DOWN states with detailed error messages
- **Response Time Tracking**: Millisecond-precision latency measurements
- **Pause/Resume**: Temporarily disable monitors without losing data
- **Instant Checks**: Manual trigger for immediate status verification

### Integration Ready
- **Graphite Export**: Automatic metrics export to Graphite (plaintext protocol)
- **External Grafana**: Ready for external Grafana dashboard integration
- **DevOps Friendly**: Designed for Docker, Jenkins, Ansible integration
- **API Access**: Built on Convex with full API capabilities

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Convex account (free tier available)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd uptime-monitor
   npm install
   ```

2. **Setup Convex**
   ```bash
   npx convex dev
   ```
   Follow the prompts to create a new Convex project or link to an existing one.

3. **Start the Application**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

### First Steps
1. Sign up/sign in with email and password
2. Click "Add Monitor" to add your first website/API
3. Enter a name and URL (e.g., "My Website", "https://example.com")
4. Watch real-time monitoring begin automatically

## Architecture

### Backend (Convex)
- **Database**: Real-time reactive database with automatic scaling
- **Functions**: Type-safe serverless functions for all operations
- **Scheduling**: Built-in cron jobs for automated monitoring
- **Authentication**: Secure user management with Convex Auth

### Frontend (React + TypeScript)
- **Real-time UI**: Live updates via Convex subscriptions
- **Responsive Design**: Tailwind CSS for modern, mobile-friendly interface
- **Type Safety**: Full TypeScript integration with Convex

### Monitoring Engine
- **Node.js Actions**: HTTP checks with 30-second timeout
- **Parallel Processing**: Concurrent monitoring of multiple endpoints
- **Error Handling**: Comprehensive error capture and reporting
- **Metrics Export**: Automatic Graphite integration

## Graphite Integration

### Setup Graphite (Optional)

1. **Install Graphite with Docker**
   ```bash
   docker run -d \
     --name graphite \
     --restart=always \
     -p 80:80 \
     -p 2003-2004:2003-2004 \
     -p 2023-2024:2023-2024 \
     -p 8125:8125/udp \
     -p 8126:8126 \
     graphiteapp/graphite-statsd
   ```

2. **Configure Environment Variables**
   In your Convex dashboard, add:
   ```
   GRAPHITE_HOST=localhost
   GRAPHITE_PORT=2003
   ```

3. **Metrics Format**
   Metrics are sent as:
   ```
   uptime.{monitor_name}.status {0|1} {timestamp}
   uptime.{monitor_name}.responseTime {milliseconds} {timestamp}
   uptime.{monitor_name}.statusCode {http_code} {timestamp}
   ```

### Grafana Dashboard

1. **Install Grafana**
   ```bash
   docker run -d \
     --name grafana \
     -p 3000:3000 \
     grafana/grafana
   ```

2. **Add Graphite Data Source**
   - URL: `http://localhost:80`
   - Access: Browser

3. **Create Dashboard**
   - Import the provided `grafana-dashboard.json`
   - Or create custom panels using the uptime metrics

## API Reference

### Key Convex Functions

#### Monitors
- `getUserMonitors()` - Get all monitors for current user
- `addMonitor(name, url, checkInterval?)` - Add new monitor
- `deleteMonitor(monitorId)` - Remove monitor
- `toggleMonitor(monitorId)` - Pause/resume monitoring

#### Monitoring
- `performUptimeCheck(monitorId, url, name)` - Execute single check
- `checkAllMonitors()` - Run all active monitors (cron job)

### Database Schema

#### monitors
```typescript
{
  name: string,
  url: string,
  userId: Id<"users">,
  isActive: boolean,
  checkInterval: number,
  createdAt: number
}
```

#### uptimeChecks
```typescript
{
  monitorId: Id<"monitors">,
  status: "UP" | "DOWN" | "ERROR",
  responseTime?: number,
  statusCode?: number,
  errorMessage?: string,
  timestamp: number
}
```

#### monitorStats
```typescript
{
  monitorId: Id<"monitors">,
  uptimePercentage: number,
  avgResponseTime: number,
  totalChecks: number,
  successfulChecks: number,
  lastStatus: "UP" | "DOWN" | "ERROR",
  lastCheckTime: number,
  lastResponseTime?: number
}
```

## Configuration

### Environment Variables

Set these in your Convex dashboard under Settings > Environment Variables:

- `GRAPHITE_HOST` - Graphite server hostname (optional)
- `GRAPHITE_PORT` - Graphite port (default: 2003)

### Monitoring Settings

- **Check Interval**: 60 seconds (configurable per monitor)
- **Timeout**: 30 seconds per request
- **Retry Logic**: Single attempt per check cycle
- **User Agent**: `UptimeMonitor/1.0`

## DevOps Integration

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy Uptime Monitor
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx convex deploy --prod
      - run: npm run build
```

### Monitoring Integration

- **Prometheus**: Export metrics via custom endpoint
- **Alertmanager**: Webhook notifications for status changes
- **Slack/Discord**: Real-time alerts via Convex actions
- **PagerDuty**: Incident management integration

## Scaling Considerations

### Performance
- **Concurrent Checks**: Handles 100+ monitors efficiently
- **Database Optimization**: Indexed queries for fast retrieval
- **Caching**: Convex handles automatic caching and optimization

### Limits
- **Convex Free Tier**: 1M function calls/month, 8GB bandwidth
- **Check Frequency**: Minimum 10-second intervals recommended
- **Data Retention**: Automatic cleanup of old check data (configurable)

## Troubleshooting

### Common Issues

1. **Monitors Not Running**
   - Check Convex deployment status
   - Verify cron job is active in dashboard
   - Check function logs for errors

2. **Graphite Connection Failed**
   - Verify GRAPHITE_HOST environment variable
   - Check network connectivity
   - Ensure Graphite is accepting connections on port 2003

3. **Authentication Issues**
   - Clear browser cache and cookies
   - Check Convex Auth configuration
   - Verify deployment is using correct auth settings

### Debug Mode

Enable detailed logging by checking function logs in the Convex dashboard:
- Go to your deployment dashboard
- Click "Functions" tab
- View real-time logs for monitoring functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: [Convex Docs](https://docs.convex.dev)
- **Community**: [Convex Discord](https://discord.gg/convex)
- **Issues**: GitHub Issues for bug reports and feature requests
