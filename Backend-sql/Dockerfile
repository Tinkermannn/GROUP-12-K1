# Use a Node.js base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy the start script early and ensure it has correct permissions and line endings
# This helps prevent 'exec format error' due to Windows line endings or missing permissions
COPY start.sh /usr/local/bin/start.sh
RUN apt-get update && apt-get install -y dos2unix && dos2unix /usr/local/bin/start.sh
RUN apt-get update && apt-get install -y dos2unix postgresql-client
RUN chmod +x /usr/local/bin/start.sh

# Copy package.json and package-lock.json first to leverage Docker cache
# This means npm install only runs if package.json changes
COPY package.json package-lock.json* ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port your Node.js application listens on (e.g., 3000)
EXPOSE 3000

# Define the command to run when the container starts
# Explicitly use 'bash' to execute the start.sh script
ENTRYPOINT ["bash", "/usr/local/bin/start.sh"]
