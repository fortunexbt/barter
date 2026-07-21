
# Deployment Guide

> **Archived Replit-era guide.** It is not a production runbook. Use the root README for the current no-database protocol lab and treat the authenticated workspace as a legacy prototype only.

This guide provides instructions for deploying the BarterTrade platform on Replit.

## Prerequisites

- Replit account
- Basic understanding of Node.js and React applications

## Deployment Steps

1. **Clone the Repository**

   Create a new Repl by forking this Repl, or import the project from GitHub if available.

2. **Environment Configuration**

   Set up environment variables in the Replit Secrets tab:
   - `SESSION_SECRET`: A secure random string for session encryption
   - `DATABASE_URL`: (Optional) If using an external database

3. **Install Dependencies**

   The project dependencies are already specified in package.json. Replit will install them automatically when you run the project.

4. **Build the Application**

   Build both the client and server components:

   ```
   npm run build
   ```

5. **Start the Application**

   Start the application using the provided start script:

   ```
   npm start
   ```

   Alternatively, use the Run button in Replit, which will execute the configured run command.

6. **Access Your Deployed Application**

   Your application will be accessible at the URL provided by Replit (visible in the output or at the top of the Replit interface).

## Database Configuration

The application currently uses an in-memory database for development purposes. For production deployment, you can configure a PostgreSQL database:

1. Set up a PostgreSQL database (using Replit Database or external provider)
2. Update the DATABASE_URL environment variable
3. Run migrations to set up database schema:
   ```
   npm run db:push
   ```

## Monitoring and Maintenance

Once deployed, monitor your application's performance:

1. Check application logs for errors or issues
2. Monitor WebSocket connections for real-time notifications
3. Set up regular database backups if using an external database

## Troubleshooting Deployment Issues

### Common Issues and Solutions

1. **Application fails to start**
   - Check the console output for error messages
   - Verify all environment variables are correctly set
   - Ensure the port is correctly configured (default: 5000)

2. **API endpoints return 500 errors**
   - Check server logs for detailed error information
   - Verify database connection (if using external database)
   - Check for incorrect environment configuration

3. **WebSocket connection issues**
   - Verify WebSocket URL is correctly set in client code
   - Check for WebSocket errors in browser console
   - Ensure WebSocket server is properly initialized

4. **Static assets not loading**
   - Make sure build process completed successfully
   - Check for path issues in static asset references
   - Verify Vite configuration

### Scaling Considerations

For larger deployments:

1. Consider implementing a database instead of in-memory storage
2. Set up appropriate connection pooling for database access
3. Implement proper caching for frequently accessed data
4. Consider horizontally scaling the application if needed

## Security Best Practices

1. Ensure `SESSION_SECRET` is a strong, unique value
2. Set appropriate Content Security Policy headers
3. Implement rate limiting for API endpoints
4. Regularly update dependencies to patch security vulnerabilities

## Backup and Recovery

1. If using an external database, set up regular backups
2. Document the deployment process for recovery purposes
3. Create snapshot backups of the entire Repl periodically
