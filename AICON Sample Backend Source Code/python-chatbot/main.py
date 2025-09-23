import asyncio
from datetime import datetime, timezone
import json
import aiohttp
from fastapi import FastAPI, HTTPException, Header, Query, UploadFile, File, Form
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import List
from pydantic import BaseModel as PydanticBaseModel
from starlette.middleware.cors import CORSMiddleware
import tempfile
from typing import Optional
import uuid
import shutil
from fastapi.responses import FileResponse
import zipfile

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client using API key from environment variables
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

# Initialize FastAPI application
app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allow all origins (for production, restrict this)
    allow_credentials=True,
    allow_methods=["*"],      # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],      # Allow all headers
)

# Temporary directories for file uploads and processed outputs
UPLOAD_DIR = tempfile.mkdtemp()
OUTPUT_DIR = tempfile.mkdtemp()

# Date/Time formats
FORMAT_DATE_TIME = "%Y/%m/%dT%H:%M:%S.000Z"
FORMAT_DATE = "%Y/%m/%d"

# File paths for local storage
CLIENTS_FILE_PATH = "clients.json"
USAGE_DATA_FILE_PATH = "usage_data.json"

# Custom BaseModel (allows arbitrary types for flexibility)
class BaseModel(PydanticBaseModel):
    class Config:
        arbitrary_types_allowed = True

# Pydantic model for client configuration
class Client(BaseModel):
    client_id: str
    client_secret: str

# ===========================
# Chat endpoint (main entry)
# ===========================
@app.post("/chat")
async def chat_with_openai(
    files: Optional[List[UploadFile]] = File(None),   # Optional uploaded files
    prompt: str = Form(...),                          # User's prompt
    authorization: Optional[str] = Header(...),       # Authorization header
    output_format: Optional[str] = Form(None)         # Optional output format
):
    try:
        # Mark timestamp start
        timestamp_start = datetime.now(timezone.utc).strftime(FORMAT_DATE_TIME)

        # Extract user_id and client_id from authorization header
        user_id, client_id = await get_user_id_and_client_id(authorization)

        response = None
        output_text = None
        token_in = 0
        token_out = 0

        # If no files uploaded, just process prompt text
        if not files:
            message_response, token_in, token_out = await process_prompts(prompt)
            response = {"message": message_response}
            output_text = message_response
        else:
            # Handle multiple files (or single file) and zip processed outputs
            temp_dir = tempfile.mkdtemp()
            zip_path = os.path.join(temp_dir, "processed_files.zip")

            file_list = files if isinstance(files, list) else [files]

            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file in file_list:
                    # Process each file with OpenAI
                    file_token_in, file_token_out, output_path = await process_file(file, output_format, prompt)
                    token_in += file_token_in
                    token_out += file_token_out

                    # Add processed file into zip archive
                    if os.path.exists(output_path):
                        zipf.write(output_path, os.path.basename(output_path))
                    
            # Return zip file as response
            response = FileResponse(
                path=zip_path,
                filename="processed_files.zip",
                media_type="application/zip"
            )
            output_text = zip_path

        # Mark timestamp end
        timestamp_end = datetime.now(timezone.utc).strftime(FORMAT_DATE_TIME)

        # Record usage asynchronously, call API AICON for the record usage
        asyncio.create_task(call_api_usage(
            user_id=user_id,
            client_id=client_id,
            timestamp_start=timestamp_start,
            timestamp_end=timestamp_end,
            token_in=token_in,
            token_out=token_out,
            input_text=prompt,
            output_text=output_text,
            response_code=200
        ))

        return response
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ===========================
# Helper functions
# ===========================

# Build messages and call OpenAI with prompt only
async def process_prompts(prompt):
    messages = [
        {"role": "system", "content": "You are an expert AI assistant."},
        {"role": "user", "content": prompt}
    ]
    message_response, token_in, token_out = await process_prompts_with_openai(messages)
    return message_response, token_in, token_out

# Call OpenAI API with prepared messages
async def process_prompts_with_openai(messages):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=8192
    )
    return (
        response.choices[0].message.content,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
    )

# Handle uploaded file: save, process with OpenAI, write output
async def process_file(file: UploadFile = File(...),
                       output_format: Optional[str] = Form(None),
                       prompt=None):
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    # Save uploaded file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Read file content
    with open(file_path, "rb") as f:
        file_content = f.read()

    # Process file with OpenAI
    file_result, token_in, token_out = await process_file_with_openai(file_content, file.filename, prompt)

    # Determine output file name
    output_filename = await determine_output_filename(file.filename, output_format)
    output_path = os.path.join(OUTPUT_DIR, f"{file_id}_{output_filename}")

    # Save processed result to file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(file_result)

    return token_in, token_out, output_path

# Extract file content and call OpenAI for processing
async def process_file_with_openai(file_content, filename, prompt):
    file_text = await extract_text_from_file(file_content, filename)

    full_prompt = f"File name: {filename}\nIntruction: {prompt}\n\nFile content:\n{file_text}"

    messages = [
        {"role": "system", "content": "You are the file processing assistant. Please process the file contents according to the instructions provided."},
        {"role": "user", "content": full_prompt}
    ]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=4000
    )

    return (
        response.choices[0].message.content,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
    )

# Try to decode file as text; fallback if binary
async def extract_text_from_file(file_content, filename):
    try:
        return file_content.decode('utf-8')
    except UnicodeDecodeError:
        return f"[Binary file contents of {filename}]"

# Generate output file name (preserve extension or use provided format)
async def determine_output_filename(input_filename, output_format=None):
    if output_format:
        base_name = os.path.splitext(input_filename)[0]
        return f"{base_name}_processed.{output_format}"
    else:
        base_name, ext = os.path.splitext(input_filename)
        return f"{base_name}_processed{ext}"

# Record API usage: log locally and send to external endpoint
async def call_api_usage(user_id,
                         client_id,
                         timestamp_start,
                         timestamp_end,
                         token_in,
                         token_out,
                         input_text,
                         output_text,
                         response_code):
    url = os.getenv("AICON_API_END_POINT") + "/aiModel/record-usage"
    client_secret = await get_client_secret(client_id)

    params = {
        "userId": user_id,
        "clientId": client_id,
        "clientSecret": client_secret,
        "dataInfo": {
            "usageGUID": str(uuid.uuid4()),
            "amountForSettlement": 100 if token_in + token_out <= 100 else 150,
            "timestampStartString": timestamp_start,
            "timestampEndString": timestamp_end,
            "tokenIn": token_in,
            "tokenOut": token_out,
            "responseCode": response_code
        },
        "parameterInfo": {
            "inputContent": input_text,
            "outputContent": output_text
        }
    }

    # Save locally
    await save_record_usage(params)

    # Send to external API
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=params) as response:
                print("Response: {} ".format(response))
        except aiohttp.ClientError as e:
            print("Exception: {} ".format(e))

# Load client secret from clients.json
async def get_client_secret(client_id):
    clients_list = await load_file(CLIENTS_FILE_PATH)

    client_secret = None

    for client in clients_list:
        if client.get("client_id") == client_id:
            client_secret = client.get("client_secret")
            break

    return client_secret

# Validate authorization header and extract user/client info
async def get_user_id_and_client_id(authorization):
    user_info = await get_user_info(authorization)

    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized.")
    
    user_id = user_info.get("user_id")

    client_id = user_info.get("client_id")

    return user_id, client_id

# Call external API to get user info
async def get_user_info(access_token):
    if not access_token:
        raise HTTPException(status_code=401, detail="Authorization header is missing.")
    
    url = os.getenv("AICON_API_END_POINT") + "/auth/sso/userinfo"
    headers = {"Authorization": access_token}

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, headers=headers) as response:
                if response.status == 401:
                    raise HTTPException(status_code=response.status, detail="Unauthorized")
                if response.status == 400:
                    raise HTTPException(status_code=response.status, detail="Can't process")
                return await response.json()
        except aiohttp.ClientError as e:
            raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Health check endpoint
@app.get("/is-alive/")
async def is_alive():
    try:
        # Check if the server is alive
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Add new client credentials
@app.post("/add-client/")
async def add_client(clients: List[Client]):
    try:
        # Initialize clients list
        clients_list = await load_file(CLIENTS_FILE_PATH)

        for client in clients:
            # Append new client
            clients_list.append({
                "client_id": client.client_id,
                "client_secret": client.client_secret
            })

        # Write updated clients list back to file
        with open(CLIENTS_FILE_PATH, "w") as file:
            json.dump(clients_list, file, indent=4)

        return {"message": "Client added successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Load JSON file (clients or usage data)
async def load_file(file_path):
    data = []

    # Read existing clients from file if it exists
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            data = json.load(file)

    return data

# Save usage data to local file
async def save_record_usage(record_usage):
    usage_data = await load_file(USAGE_DATA_FILE_PATH)
    usage_data.append({
        "settlement_date": datetime.now(timezone.utc).strftime(FORMAT_DATE),
        "record_usage": record_usage
    })
    with open(USAGE_DATA_FILE_PATH, "w") as file:
        json.dump(usage_data, file, indent=4)

# Retrieve usage data for billing/settlement with pagination
@app.get("/get-usage-for-settlement")
async def get_usage_for_settlement(
    page_size: int = Query(..., ge=1, le=1000, alias="pageSize"),
    page_number: int = Query(..., ge=1, alias="pageNumber"),
    settlement_start_date: str = Query(..., alias="settlementStartDate"),
    settlement_end_date: str = Query(..., alias="settlementEndDate")
):
    try:
        # Input
        
        # Get usage data
        usage_data = await load_file(USAGE_DATA_FILE_PATH)

        # Get usage data for the specified settlement date range
        filtered_data = [
            record for record in usage_data
            if datetime.strptime(settlement_start_date, FORMAT_DATE) <= datetime.strptime(record["settlement_date"], FORMAT_DATE) <= datetime.strptime(settlement_end_date, FORMAT_DATE)
        ]

        total_count = len(filtered_data)

        total_pages = (total_count + page_size - 1) // page_size

        model_usages = filtered_data[(page_number - 1) * page_size: page_number * page_size]

        model_usages = [model_usage.get("record_usage") for model_usage in model_usages]

        response = {
            "pageNumber": page_number,
            "pageSize": page_size,
            "totalCount": total_count,
            "totalPages": total_pages,
            "modelUsages": model_usages
        }

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Alternative chat endpoint (e.g., for translation use case)
@app.post("/chat-type-2")
async def chat_type_2(
    input_text: Optional[str] = Form(None, alias="InputText"),
    source_language: Optional[str] = Form(None, alias="SourceLanguage"),
    target_language: Optional[str] = Form(None, alias="TargetLanguage"),
    authorization: Optional[str] = Header(...)
):
    try:
        # Timestamp start
        timestamp_start = datetime.now(timezone.utc).strftime(FORMAT_DATE_TIME)

        # Get user id and client id
        user_id, client_id = await get_user_id_and_client_id(authorization)

        response = None
        token_in = 0
        token_out = 0

        prompt = "Translate the following text from {} to {}:\n{}".format(source_language, target_language, input_text)

        message_response, token_in, token_out = await process_prompts(prompt)
        response = [
            {
                "Type": "Text",
                "ParamName": "TranlateResult",
                "Value": message_response
            },
            {
                "Type": "Text",
                "ParamName": "message",
                "Value": message_response
            },
            {
                "Type": "File",
                "ParamName": "TranslateImage",
                "Value": "https://dev.aicon.or.kr/images/no-record-found.jpg"
            },
            {
                "Type": "TEXT",
                "ParamName": "TranslateGuid",
                "Value": str(uuid.uuid4())
            }
        ]

        # Timestamp end
        timestamp_end = datetime.now(timezone.utc).strftime(FORMAT_DATE_TIME)

        asyncio.create_task(call_api_usage(user_id=user_id,
                                           client_id=client_id,
                                           timestamp_start=timestamp_start,
                                           timestamp_end=timestamp_end,
                                           token_in=token_in,
                                           token_out=token_out,
                                           input_text=prompt,
                                           output_text=json.dumps(response),
                                           response_code=200))

        return response
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Cleanup temporary directories on shutdown
@app.on_event("shutdown")
def cleanup():
    shutil.rmtree(UPLOAD_DIR, ignore_errors=True)
    shutil.rmtree(OUTPUT_DIR, ignore_errors=True)

# Run server:
# uvicorn main:app --reload
