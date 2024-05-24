# Use an official Python runtime as a parent image
FROM python:3.8-slim

# Set the working directory in the container
WORKDIR /solver

# Copy the requirements.txt file into the container
COPY requirements.txt /solver/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /solver

# Make port available to the world outside this container
EXPOSE 4008

# Run app.py when the container launches
CMD ["python", "app.py"]
