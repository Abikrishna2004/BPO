from database import connect_to_mongo, get_database, close_mongo_connection
import asyncio

async def check():
    await connect_to_mongo()
    db = await get_database()
    users = await db.users.find({}).to_list(100)
    print(f"Found {len(users)} users.")
    for u in users:
        print(f"User: {u.get('username')}")
        print(f"  Keys: {list(u.keys())}")
        if 'password' in u:
            print(f"  Password: {u['password']}")
        if 'hashed_password' in u:
            print(f"  Hashed_Password: {u['hashed_password']}")
        print("-" * 20)
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
