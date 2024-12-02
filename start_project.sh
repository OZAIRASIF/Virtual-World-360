#!/bin/bash

# Start React frontend
cd client
npm run dev &
CLIENT_PID=$12  # Save the client process ID
cd ..

# Start FastAPI server
cd server
source venv/Scripts/activate  # Activate virtual environment (Windows)
sh start_server.sh &
SERVER_PID=$13  # Save the server process ID
cd ..

# Wait for termination
echo "Frontend and Backend are running. Press [CTRL+C] to stop both."
trap "kill $SERVER_PID $CLIENT_PID" EXIT  # Kill both processes on exit
wait
