FROM python:3.10-slim

WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy project files
COPY pyproject.toml poetry.lock* ./
COPY app ./app

# Configure poetry to not create a virtual environment
RUN poetry config virtualenvs.create false

# Install dependencies
RUN poetry install --only main

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]