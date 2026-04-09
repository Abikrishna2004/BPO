import asyncio
import websockets
import json
import random

async def simulate_calls():
    uri = "ws://localhost:8000/ws"
    async with websockets.connect(uri) as websocket:
        print(f"Connected to {uri}")
        
        call_types = ["Inbound Call", "Outbound Call", "Support Ticket", "Escalation"]
        customers = ["John Doe", "Jane Smith", "Acme Corp", "Tech Solutions"]
        
        while True:
            # Generate a random event
            event_type = random.choice(call_types)
            customer = random.choice(customers)
            message = f"New {event_type} from {customer}"
            
            print(f"Sending: {message}")
            await websocket.send(message)
            
            # Wait for random interval
            await asyncio.sleep(random.uniform(2, 5))

if __name__ == "__main__":
    try:
        asyncio.run(simulate_calls())
    except KeyboardInterrupt:
        print("Simulation stopped")
    except Exception as e:
        print(f"Connection failed: {e}")
