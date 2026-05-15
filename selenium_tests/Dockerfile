FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    wget curl unzip gnupg chromium chromium-driver \
    && rm -rf /var/lib/apt/lists/*
RUN pip install selenium==4.18.1
WORKDIR /tests
COPY test_selenium.py .
CMD ["python", "test_selenium.py"]
