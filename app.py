from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient(os.getenv("MONGO_URI"))
db = client["taskmanager"]
todos_collection = db["todos"]

# Helper to serialize ObjectId
def serialize_todo(todo):
    todo["_id"] = str(todo["_id"])
    return todo

# Pydantic model
class Todo(BaseModel):
    title: str
    description: str

# Get all todos (optional: returns all, completed and incomplete)
@app.get("/todos")
def get_all_todos():
    todos = list(todos_collection.find())
    return [serialize_todo(todo) for todo in todos]

# Get incomplete todos
@app.get("/todos/incomplete")
def get_incomplete_todos():
    todos = list(todos_collection.find({"completedOn": {"$exists": False}}))
    return [serialize_todo(todo) for todo in todos]

# Get completed todos
@app.get("/todos/completed")
def get_completed_todos():
    todos = list(todos_collection.find({"completedOn": {"$exists": True}}))
    return [serialize_todo(todo) for todo in todos]

# Add new todo
@app.post("/todos")
def add_todo(todo: Todo):
    result = todos_collection.insert_one(todo.dict())
    return {"message": "Todo added", "id": str(result.inserted_id)}

# Delete todo by id
@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: str):
    result = todos_collection.delete_one({"_id": ObjectId(todo_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Todo deleted"}

# Update (edit) todo title & description
@app.put("/todos/{todo_id}")
def update_todo(todo_id: str, data: Todo = Body(...)):
    result = todos_collection.update_one(
        {"_id": ObjectId(todo_id)},
        {"$set": {"title": data.title, "description": data.description}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found or not modified")
    return {"message": "Todo updated"}

# Mark todo as complete
@app.put("/todos/{todo_id}/complete")
def complete_todo(todo_id: str):
    completed_time = datetime.now().strftime("%d-%m-%Y at %H:%M:%S")
    result = todos_collection.update_one(
        {"_id": ObjectId(todo_id)},
        {"$set": {"completedOn": completed_time}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found or already completed")
    return {"message": "Todo marked as completed"}
