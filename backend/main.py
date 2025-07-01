from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel, Field, Session, create_engine, select, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random
import os

DB_PATH = os.getenv("DB_PATH", "tokens.db")
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)

app = FastAPI(title="MemeFun API", description="Indian memecoin simulator like Pump.fun")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Token(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    symbol: str
    supply: int
    image: Optional[str] = None
    price: float = 1.0
    market_cap: float = 0.0
    holders: int = 1
    volume: float = 0.0
    launched_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        table = True

class Trade(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    token_id: int = Field(foreign_key="token.id")
    type: str
    amount_inr: float
    price: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        table = True

class TokenCreate(BaseModel):
    name: str
    symbol: str
    supply: int
    image: Optional[str] = None

class TradeRequest(BaseModel):
    amount_inr: float

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

@app.post("/api/launch", response_model=Token)
def launch_token(token: TokenCreate):
    price = round(random.uniform(0.1, 10), 2)
    market_cap = price * token.supply
    holders = random.randint(1, 10)
    volume = round(random.uniform(100, 10000), 2)
    t = Token(
        name=token.name,
        symbol=token.symbol,
        supply=token.supply,
        image=token.image,
        price=price,
        market_cap=market_cap,
        holders=holders,
        volume=volume,
        launched_at=datetime.utcnow(),
    )
    with Session(engine) as session:
        session.add(t)
        session.commit()
        session.refresh(t)
    return t

@app.get("/api/tokens", response_model=List[Token])
def get_tokens():
    with Session(engine) as session:
        tokens = session.exec(select(Token)).all()
    return tokens

@app.get("/api/token/{id}", response_model=Token)
def get_token(id: int):
    with Session(engine) as session:
        token = session.get(Token, id)
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
    return token

@app.post("/api/token/{id}/buy")
def buy_token(id: int, trade: TradeRequest):
    with Session(engine) as session:
        token = session.get(Token, id)
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        # Pricing logic
        factor = 0.02
        price_increase = trade.amount_inr / token.supply * factor
        token.price = round(token.price + price_increase, 4)
        token.volume += trade.amount_inr
        token.holders += 1
        token.market_cap = token.price * token.supply
        session.add(token)
        session.add(Trade(token_id=id, type="buy", amount_inr=trade.amount_inr, price=token.price))
        session.commit()
        session.refresh(token)
    return {"success": True, "new_price": token.price, "volume": token.volume, "holders": token.holders}

@app.post("/api/token/{id}/sell")
def sell_token(id: int, trade: TradeRequest):
    with Session(engine) as session:
        token = session.get(Token, id)
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        factor = 0.02
        price_decrease = trade.amount_inr / token.supply * factor
        token.price = round(max(token.price - price_decrease, 0.01), 4)
        token.volume = max(token.volume - trade.amount_inr, 0)
        token.holders = max(token.holders - 1, 1)
        token.market_cap = token.price * token.supply
        session.add(token)
        session.add(Trade(token_id=id, type="sell", amount_inr=trade.amount_inr, price=token.price))
        session.commit()
        session.refresh(token)
    return {"success": True, "new_price": token.price, "volume": token.volume, "holders": token.holders}

@app.get("/api/token/{id}/chart")
def get_chart(id: int):
    # Return mock OHLC price history for chart
    with Session(engine) as session:
        trades = session.exec(select(Trade).where(Trade.token_id == id).order_by(desc(Trade.timestamp)).all())
        if not trades:
            return []
        # Generate OHLC from trades (mocked)
        ohlc = []
        for t in trades:
            ohlc.append({
                "timestamp": t.timestamp.isoformat(),
                "open": t.price,
                "high": t.price + random.uniform(0, 1),
                "low": max(t.price - random.uniform(0, 1), 0.01),
                "close": t.price
            })
    return ohlc

@app.get("/api/token/{id}/trustscore")
def get_trustscore(id: int):
    # Mock trust score: random or rule-based
    with Session(engine) as session:
        token = session.get(Token, id)
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        # Example: higher price and volume = higher trust
        score = min(100, int(token.price * 10 + token.volume / 1000))
    return {"id": id, "trust_score": score}

@app.get("/api/token/{id}/trades")
def get_trades(id: int, limit: int = 20):
    with Session(engine) as session:
        trades = session.exec(select(Trade).where(Trade.token_id == id).order_by(desc(Trade.timestamp)).limit(limit)).all()
        return [
            {"type": t.type, "amount_inr": t.amount_inr, "price": t.price, "timestamp": t.timestamp.isoformat()} for t in trades
        ]

@app.get("/api/leaderboard")
def leaderboard(sort_by: str = "volume"):
    with Session(engine) as session:
        if sort_by == "market_cap":
            tokens = session.exec(select(Token).order_by(desc(Token.market_cap))).all()
        else:
            tokens = session.exec(select(Token).order_by(desc(Token.volume))).all()
    return tokens 