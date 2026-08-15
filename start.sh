#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Starting Phishing Detector System ===${NC}"

# Stop background services on script exit (Ctrl+C)
trap 'echo -e "\nShutting down services..."; kill 0' EXIT

# 1. Start Ollama server if not already running
if ! pgrep -x "ollama" > /dev/null; then
    echo -e "${GREEN}[1/3] Starting Ollama service...${NC}"
    ollama serve > /dev/null 2>&1 &
    sleep 2
else
    echo -e "${GREEN}[1/3] Ollama service already active.${NC}"
fi

# 2. Warm up Qwen 2.5 model
echo -e "${GREEN}[2/3] Initializing qwen2.5:3b model...${NC}"
ollama run qwen2.5:3b "" > /dev/null 2>&1 &

# 3. Start Express backend API
echo -e "${GREEN}[3/3] Launching Node.js API server...${NC}"
node src/index.js
