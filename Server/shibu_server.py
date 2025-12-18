import uvicorn
import os
import sys

# Ensure we can import from main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("STARTING SHIBU SERVER V2 (PORT 8001)...")
    # Run the app from main.py on port 8001 to avoid conflict with the stuck 8000 process
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
