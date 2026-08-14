FROM postgres:17-alpine

# Set default environment variables for PostgreSQL initialization
ENV POSTGRES_DB=backend_db
ENV POSTGRES_USER=postgres

# Expose the default PostgreSQL port
EXPOSE 5432

# Switch to non-root user for security
USER postgres

# Health check to ensure PostgreSQL service is healthy and ready to accept connections
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} || exit 1
