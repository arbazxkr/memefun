from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import aiosqlite
import asyncio
import random
from datetime import datetime
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "tokens.db"

class TokenIn(BaseModel):
    name: str
    symbol: str
    supply: int
    image: Optional[str] = None

class Token(TokenIn):
    id: int
    price: float
    market_cap: float
    holders: int
    volume: float
    launched_at: str

class Trade(BaseModel):
    token_id: int
    amount: int

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            symbol TEXT,
            supply INTEGER,
            image TEXT,
            price REAL,
            market_cap REAL,
            holders INTEGER,
            volume REAL,
            launched_at TEXT
        )''')
        await db.execute('''CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_id INTEGER,
            type TEXT,
            amount INTEGER,
            price REAL,
            timestamp TEXT
        )''')
        await db.commit()

@app.on_event("startup")
async def startup():
    await init_db()

@app.post("/api/launch", response_model=Token)
async def launch_token(token: TokenIn):
    price = round(random.uniform(0.1, 10), 2)
    market_cap = price * token.supply
    holders = random.randint(1, 10)
    volume = round(random.uniform(100, 10000), 2)
    launched_at = datetime.utcnow().isoformat() + 'Z'
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            INSERT INTO tokens (name, symbol, supply, image, price, market_cap, holders, volume, launched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (token.name, token.symbol, token.supply, token.image, price, market_cap, holders, volume, launched_at)
        )
        await db.commit()
        token_id = cursor.lastrowid
    return Token(id=token_id, **token.dict(), price=price, market_cap=market_cap, holders=holders, volume=volume, launched_at=launched_at)

@app.get("/api/tokens", response_model=List[Token])
async def get_tokens():
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT * FROM tokens")
        rows = await cursor.fetchall()
        tokens = [Token(
            id=row[0], name=row[1], symbol=row[2], supply=row[3], image=row[4],
            price=row[5], market_cap=row[6], holders=row[7], volume=row[8], launched_at=row[9]
        ) for row in rows]
    return tokens

@app.get("/api/token/{id}", response_model=Token)
async def get_token(id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT * FROM tokens WHERE id = ?", (id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Token not found")
        return Token(
            id=row[0], name=row[1], symbol=row[2], supply=row[3], image=row[4],
            price=row[5], market_cap=row[6], holders=row[7], volume=row[8], launched_at=row[9]
        )

@app.post("/api/buy")
async def buy_token(trade: Trade):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT price, holders, volume, supply FROM tokens WHERE id = ?", (trade.token_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Token not found")
        price, holders, volume, supply = row
        # Simulate price increase and volume
        price = round(price * (1 + 0.01 * trade.amount), 4)
        volume = round(volume + trade.amount * price, 2)
        holders = holders + 1
        await db.execute("UPDATE tokens SET price = ?, holders = ?, volume = ? WHERE id = ?", (price, holders, volume, trade.token_id))
        await db.execute(
            "INSERT INTO trades (token_id, type, amount, price, timestamp) VALUES (?, ?, ?, ?, ?)",
            (trade.token_id, 'buy', trade.amount, price, datetime.utcnow().isoformat() + 'Z')
        )
        await db.commit()
    return {"success": True, "new_price": price, "volume": volume, "holders": holders}

@app.post("/api/sell")
async def sell_token(trade: Trade):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT price, holders, volume FROM tokens WHERE id = ?", (trade.token_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Token not found")
        price, holders, volume = row
        # Simulate price decrease and volume
        price = round(max(price * (1 - 0.01 * trade.amount), 0.01), 4)
        volume = round(max(volume - trade.amount * price, 0), 2)
        holders = max(holders - 1, 1)
        await db.execute("UPDATE tokens SET price = ?, holders = ?, volume = ? WHERE id = ?", (price, holders, volume, trade.token_id))
        await db.execute(
            "INSERT INTO trades (token_id, type, amount, price, timestamp) VALUES (?, ?, ?, ?, ?)",
            (trade.token_id, 'sell', trade.amount, price, datetime.utcnow().isoformat() + 'Z')
        )
        await db.commit()
    return {"success": True, "new_price": price, "volume": volume, "holders": holders}

@app.get("/api/trustscore/{id}")
async def get_trust_score(id: int):
    # Simulate trust score
    return {"id": id, "trust_score": random.randint(0, 100)}

@app.get("/api/trades/{token_id}")
async def get_trades(token_id: int, limit: int = 20):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT type, amount, price, timestamp FROM trades WHERE token_id = ? ORDER BY timestamp DESC LIMIT ?",
            (token_id, limit)
        )
        rows = await cursor.fetchall()
        trades = [
            {"type": row[0], "amount": row[1], "price": row[2], "timestamp": row[3]} for row in rows
        ]
    return JSONResponse(content=trades) 