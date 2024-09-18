# Use the official Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Create a virtual environment for Python
RUN python3 -m venv /opt/venv

# Activate virtual environment and install Python dependencies
COPY requirements.txt .
RUN /opt/venv/bin/pip install --upgrade pip && /opt/venv/bin/pip install -r requirements.txt

# Copy the rest of the application code to the container
COPY ./ /app

RUN npm install

# Ensure the virtual environment is used for the application
ENV PATH="/opt/venv/bin:$PATH"

# Start the Node.js application
CMD ["node", "server.js"]

