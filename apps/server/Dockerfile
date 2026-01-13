# Use official Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start the application
# Note: Adjusted for the new modular structure (main.py is in /app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
