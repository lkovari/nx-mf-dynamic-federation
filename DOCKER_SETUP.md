# Docker Compose Setup Guide for Angular Micro Frontends

This guide explains how to run your Angular micro frontend application using Docker Compose in Docker Desktop.

## Overview

Your application consists of:
- **Main Host** (port 4200) - The shell application that loads remote modules
- **Remote A** (port 4201) - First micro frontend
- **Remote B** (port 4202) - Second micro frontend  
- **Remote Home** (port 4203) - Home micro frontend

## Step-by-Step Setup

### Step 1: Prerequisites

1. **Install Docker Desktop**
   - Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Ensure Docker Desktop is running (you'll see the Docker icon in your system tray)

2. **Verify Docker Installation**
   ```bash
   docker --version
   docker compose version
   ```

### Step 2: Understanding the Docker Files

#### Dockerfile

The `Dockerfile` defines how to build the container image:

```dockerfile
FROM node:20-alpine
```
- **Why**: Uses Node.js 20 (LTS) on Alpine Linux (lightweight, ~5MB base image)
- **What**: Sets the base image for all containers

```dockerfile
WORKDIR /workspace
```
- **Why**: Sets the working directory inside the container
- **What**: All commands run from `/workspace`

```dockerfile
RUN corepack enable && corepack prepare pnpm@latest --activate
```
- **Why**: Enables pnpm (your package manager) in Node.js
- **What**: Corepack is built into Node.js 20+ and manages package managers

```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
```
- **Why**: Copy dependency files first (Docker layer caching optimization)
- **What**: If dependencies don't change, Docker reuses the cached layer
- **Note**: The build context is set to `./nx-mf-df` in docker-compose.yml, so these files are copied from the nx-mf-df directory

```dockerfile
RUN pnpm install --frozen-lockfile
```
- **Why**: Install dependencies before copying source code
- **What**: `--frozen-lockfile` ensures exact versions from lock file

```dockerfile
COPY . ./
```
- **Why**: Copy all source code after dependencies are installed
- **What**: Source code changes more frequently, so this layer invalidates less often
- **Note**: The build context is set to `./nx-mf-df` in docker-compose.yml, so this copies everything from the nx-mf-df directory

```dockerfile
RUN apk add --no-cache curl
```
- **Why**: Needed for health checks in docker-compose
- **What**: Alpine's package manager installs curl

```dockerfile
EXPOSE 4200 4201 4202 4203
```
- **Why**: Documents which ports the container uses
- **What**: Doesn't actually publish ports (docker-compose does that)

```dockerfile
CMD ["pnpm", "start"]
```
- **Why**: Default command if no command is specified in docker-compose
- **What**: Runs `pnpm start` which serves the main-host application
- **Note**: This is overridden by the `command` field in docker-compose.yml for each service

#### .dockerignore

The `.dockerignore` file specifies which files and directories should be excluded from the Docker build context:

```
node_modules
.nx
dist
coverage
.git
.gitignore
*.log
.DS_Store
.vscode
.idea
*.swp
*.swo
*~
.env.local
.env.*.local
```

- **Why**: Reduces build context size and prevents copying unnecessary files
- **What**: Similar to `.gitignore`, but for Docker builds
- **Benefits**: Faster builds, smaller images, and prevents sensitive files from being included

#### docker-compose.yml

The `docker-compose.yml` orchestrates multiple containers:

**Service Definition (main-host example):**

```yaml
main-host:
  build:
    context: ./nx-mf-df
    dockerfile: ../Dockerfile
```
- **Why**: Builds the image from the Dockerfile
- **What**: 
  - `context: ./nx-mf-df` sets the build context to the nx-mf-df directory (relative to docker-compose.yml location)
  - `dockerfile: ../Dockerfile` points to the Dockerfile in the parent directory
  - All COPY commands in the Dockerfile are relative to the build context (nx-mf-df)

```yaml
container_name: nx-mf-main-host
```
- **Why**: Gives the container a readable name
- **What**: Without this, Docker generates random names

```yaml
ports:
  - "4200:4200"
```
- **Why**: Maps container port 4200 to host port 4200
- **What**: Format is `host:container` - allows accessing from your machine

```yaml
volumes:
  - ./nx-mf-df:/workspace
  - /workspace/node_modules
  - /workspace/.nx
```
- **Why**: 
  - First volume: Syncs your code (enables hot reload)
  - Second volume: Anonymous volume for node_modules (prevents host overwrite)
  - Third volume: Anonymous volume for .nx cache (preserves build cache)
- **What**: Volumes mount host directories into containers

```yaml
environment:
  - NODE_ENV=development
```
- **Why**: Sets environment variables inside the container
- **What**: Angular/Nx can use this for development optimizations

```yaml
command: pnpm nx serve main-host
environment:
  - HOST=0.0.0.0
```
- **Why**: 
  - Overrides the Dockerfile CMD
  - The `host: "0.0.0.0"` option in `project.json` binds to all network interfaces
  - `HOST=0.0.0.0` environment variable provides additional configuration
  - Without this, the server binds to `localhost` (or `::1` IPv6) and isn't accessible from outside the container
- **What**: Runs the dev server for main-host, making it accessible from the host machine
- **Note**: The host binding is configured in `project.json` files (already set to `"host": "0.0.0.0"`), not via command-line flags

```yaml
networks:
  - nx-mf-network
```
- **Why**: All services on same network can communicate
- **What**: Services can reach each other by service name (e.g., `http://main-host:4200`)

```yaml
depends_on:
  main-host:
    condition: service_healthy
restart: unless-stopped
```
- **Why**: 
  - Waits for main-host to be healthy before starting (applies to remote services)
  - `restart: unless-stopped` automatically restarts the container if it crashes
- **What**: Ensures proper startup order and resilience for micro frontends
- **Note**: Only remote services (mf-remote-a, mf-remote-b, mf-remote-home) depend on main-host

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4200"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```
- **Why**: Docker checks if service is responding
- **What**: 
  - `test`: Command to check health
  - `interval`: How often to check
  - `timeout`: Max time for check
  - `retries`: Failed checks before marking unhealthy
  - `start_period`: Grace period before checks start

### Step 3: Build and Run

1. **Navigate to project root** (where docker-compose.yml is located):
   ```bash
   cd /Users/kovarilaszlo/src/angular/nx-mf-dynamic-federation
   ```

2. **Build and start all services**:
   ```bash
   docker compose up --build
   ```
   
   - `--build`: Rebuilds images before starting
   - First run will take several minutes (downloads base image, installs dependencies)

3. **Run in detached mode** (background):
   ```bash
   docker compose up -d
   ```

4. **View logs**:
   ```bash
   # All services
   docker compose logs -f
   
   # Specific service
   docker compose logs -f main-host
   ```

5. **Stop services**:
   ```bash
   docker compose down
   ```

### Step 4: Access Your Application

Once all services are running:

- **Main Host**: http://localhost:4200
- **Remote A**: http://localhost:4201
- **Remote B**: http://localhost:4202
- **Remote Home**: http://localhost:4203

The main host will automatically load the remote modules from their respective ports.

## Common Commands

```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild and start
docker compose up --build

# View running containers
docker compose ps

# Execute command in container
docker compose exec main-host sh

# View logs
docker compose logs -f [service-name]

# Restart a specific service
docker compose restart main-host
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

1. **Check what's using the port**:
   ```bash
   lsof -i :4200
   ```

2. **Stop the process** or change ports in docker-compose.yml:
   ```yaml
   ports:
     - "4201:4200"  # Maps host 4201 to container 4200
   ```

### Container Won't Start

1. **Check logs**:
   ```bash
   docker compose logs main-host
   ```

2. **Check if dependencies installed**:
   ```bash
   docker compose exec main-host ls -la node_modules
   ```

### Connection Reset Error (ERR_CONNECTION_RESET)

If you see `ERR_CONNECTION_RESET` when accessing `localhost:4200`:

**Root Cause**: The dev server is binding to `localhost` (127.0.0.1) or IPv6 `::1` inside the container, which only accepts connections from within the container itself. Docker port mapping can't forward connections to a service that's only listening on localhost.

**Solution**: The host binding is already configured in `project.json` files. Each service has:

```json
{
  "serve": {
    "options": {
      "port": 4200,
      "host": "0.0.0.0",
      "publicHost": "http://localhost:4200"
    }
  }
}
```

Additionally, the `HOST=0.0.0.0` environment variable is set in docker-compose.yml for each service.

**Why**: Nx doesn't recognize `--hostname` or `--host` as command-line flags. The host must be configured in the project configuration files.

This makes the server listen on all network interfaces, allowing Docker to forward connections from your host machine.

**Note**: If you're still experiencing connection issues, verify that the `host: "0.0.0.0"` setting is present in all `project.json` files for the serve targets.

**Verify the fix**:
1. Restart the containers:
   ```bash
   docker compose down
   docker compose up --build
   ```

2. Check logs to confirm the server is listening:
   ```bash
   docker compose logs main-host | grep "Local:"
   ```
   You should see something like `Local: http://0.0.0.0:4200/`

### EADDRINUSE - Port Already in Use

If you see `Error: listen EADDRINUSE: address already in use ::1:4203`:

**Root Cause**: Ports 4200-4203 are already in use, either by:
- Services running on your host machine (outside Docker)
- Previous Docker containers that didn't shut down properly
- Port conflicts between containers

**Solution**:
1. **Check for processes using ports**:
   ```bash
   lsof -i :4200
   lsof -i :4201
   lsof -i :4202
   lsof -i :4203
   ```

2. **Stop any local dev servers**:
   ```bash
   pkill -f "nx serve"
   kill -9 $(lsof -t -i:4200) 2>/dev/null
   kill -9 $(lsof -t -i:4201) 2>/dev/null
   kill -9 $(lsof -t -i:4202) 2>/dev/null
   kill -9 $(lsof -t -i:4203) 2>/dev/null
   ```

3. **Clean up Docker containers**:
   ```bash
   docker compose down -v
   docker ps -a | grep nx-mf | awk '{print $1}' | xargs docker rm -f
   ```

4. **Restart Docker Desktop** if issues persist

See `TROUBLESHOOTING.md` for more detailed solutions.

### Hot Reload Not Working

1. **Verify volumes are mounted**:
   ```bash
   docker compose exec main-host ls -la /workspace
   ```

2. **Check file permissions** (on macOS/Linux):
   - Ensure Docker Desktop has file sharing enabled for your project directory

### Out of Memory

If containers crash due to memory:

1. **Increase Docker Desktop memory**:
   - Docker Desktop → Settings → Resources → Memory
   - Recommended: At least 4GB for this setup

### Clean Start

If things get corrupted:

```bash
# Stop everything
docker compose down

# Remove containers, networks, and volumes
docker compose down -v

# Remove images
docker compose rm -f

# Rebuild from scratch
docker compose up --build
```
# Check all services are running
docker compose ps

# Check main-host is listening on 0.0.0.0
docker compose logs main-host | grep "Local:"

# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f mf-remote-a

## Production Considerations

This setup is for **development only**. For production:

1. **Build the applications** instead of running dev servers
2. **Use nginx** or similar to serve static files
3. **Remove volume mounts** (code shouldn't change in production)
4. **Use multi-stage builds** to reduce image size
5. **Set NODE_ENV=production**
6. **Use proper secrets management** (not environment variables in compose file)

## How Module Federation Works in Docker

**Important**: The micro frontends don't communicate directly with each other through Docker networking. Instead:

1. **Browser Access**: Your browser (on your host machine) connects to `http://localhost:4200` (main host)
2. **Module Loading**: The main host's JavaScript code (running in your browser) fetches remote modules from:
   - `http://localhost:4201` (Remote A)
   - `http://localhost:4202` (Remote B)
   - `http://localhost:4203` (Remote Home)
3. **Port Mapping**: Docker maps container ports to host ports, making all services accessible from your browser

This is why we use `localhost` in the configuration - the browser needs to access these URLs, not the containers themselves.

## Architecture Benefits

- **Isolation**: Each micro frontend runs in its own container
- **Scalability**: Can scale individual services independently
- **Consistency**: Same environment across all developers
- **Reproducibility**: Works the same on any machine with Docker
- **Network**: Services are isolated but accessible via port mapping

## Important Notes

### Service Names and Commands

The docker-compose service names use hyphens (`mf-remote-a`, `mf-remote-b`, `mf-remote-home`), but the Nx project names use underscores (`mf_remote_a`, `mf_remote_b`, `mf_remote_home`). The commands correctly use the project names with underscores:
- `pnpm nx serve mf_remote_a`
- `pnpm nx serve mf_remote_b`
- `pnpm nx serve mf_remote_home`

### Executors Used

- **main-host**: Uses `@nx/angular:module-federation-dev-server` executor (for Module Federation host)
- **Remote services**: Use `@nx/angular:dev-server` executor (standard Angular dev server)

### Correct Ports to Access

- **Main Host**: http://localhost:4200
- **Remote A**: http://localhost:4201
- **Remote B**: http://localhost:4202
- **Remote Home**: http://localhost:4203

### Service Auto-Restart

All services have `restart: unless-stopped` policy, which means:
- If a service crashes, Docker will automatically restart it
- This helps with transient errors and port conflicts
- Check logs if a service keeps restarting: `docker compose logs [service-name]`

### Host Binding Configuration

All services are configured to bind to `0.0.0.0` in their respective `project.json` files:
- This allows Docker to forward connections from the host machine
- The configuration is in the `serve.targets.options.host` field
- The `HOST=0.0.0.0` environment variable in docker-compose.yml provides additional configuration

## Next Steps

1. **Add environment variables** via `.env` file for configuration
2. **Add nginx** for reverse proxy/routing
3. **Set up CI/CD** to build and push images
4. **Add monitoring** and logging solutions
5. **Implement health checks** in your Angular apps

## Additional Resources

- See `TROUBLESHOOTING.md` for detailed solutions to common issues (if it exists)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nx Module Federation Guide](https://nx.dev/recipes/module-federation/module-federation-angular)
