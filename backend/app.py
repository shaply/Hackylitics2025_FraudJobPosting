from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from bs4 import BeautifulSoup, Comment
from lxml import etree
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional
import enum

import tensorflow as tf
from keras._tf_keras.keras.utils import pad_sequences
import numpy as np
import pickle

# Limit GPU memory growth
gpus = tf.config.experimental.list_physical_devices("GPU")
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        print(e)

model = tf.keras.models.load_model("model/job_posting_model.keras")

with open("model/tokenizer.pkl", "rb") as handle:
    tokenizer = pickle.load(handle)

MAX_SEQUENCE_LENGTH = 200  # Use the same max length as in training


class JobData(BaseModel):
    title: str
    company: str
    location: str
    additional_info: List[str] = Field(..., alias="additionalInfo")
    description: str
    company_description: str = Field(..., alias="companyDescription")


class JobListing(BaseModel):
    job_data: JobData = Field(..., alias="jobData")


class EmploymentType(str, enum.Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    TEMPORARY = "Temporary"
    OTHER = "Other"


class ExtractJobPosting(BaseModel):
    full_job_description: str
    full_job_requirements: str
    telecommuting: bool
    industry: str
    salary_range_lower: Optional[int]
    salary_range_upper: Optional[int]
    job_functions: List[str]
    benefits: str


client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def predict_job_posting(job_text):
    """
    Predict whether a job posting is fake (1) or real (0).

    Args:
        job_text (str): The job posting text.

    Returns:
        float: Probability of the job being fraudulent.
    """
    # Convert text to sequence
    sequence = tokenizer.texts_to_sequences([job_text])

    # Pad the sequence
    padded_sequence = pad_sequences(
        sequence, maxlen=MAX_SEQUENCE_LENGTH, padding="post", truncating="post"
    )

    # Get prediction
    prediction = model.predict(padded_sequence)[0][0]  # Get probability score

    # Convert probability to class label
    predicted_label = 1 if prediction > 0.5 else 0

    return predicted_label, prediction


def extract_job_posting(description: str) -> ExtractJobPosting:
    try:
        completion = client.beta.chat.completions.parse(
            model="deepseek-r1:7b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI specialized in extracting structured job postings from text. "
                        "Analyze the provided job listing and extract key details including the full job description, "
                        "specific job requirements, whether telecommuting is allowed, the industry, and job functions. "
                        "Preserve as much detail as possible while ensuring accuracy and clarity."
                        "Extract the job posting details **exactly** as they appear in the provided text. "
                        "Do not summarize, rephrase, or provide interpretations. "
                        "Each field should contain the direct text from the job listing without modification. "
                        "Preserve the original sentence structure, bullet points, and formatting where applicable."
                    ),
                },
                {
                    "role": "user",
                    "content": description,
                },
            ],
            response_format=ExtractJobPosting,
        )

        response = completion.choices[0].message
        if response.parsed:
            return response.parsed
        elif response.refusal:
            print(response.refusal)
            raise Exception(f"Failed to extract job posting: {response.refusal}")
    except Exception as e:
        print(f"Error in extracting job posting: {e}")
        return None


@app.post("/getResponse")
async def get_response(request: JobListing):
    job_data = request.job_data

    description = job_data.description
    job_posting = extract_job_posting(description)

    """
    Order:
    title
    description
    requirements
    company_profile
    telecommuting
    location
    salary_range
    employment_type
    industry
    benefits
    """

    string = f"{job_data.title}{job_posting.full_job_description}{job_posting.full_job_requirements}{job_data.company_description}\
               {1 if job_posting.telecommuting else 0}{job_data.location}{job_data.additional_info[0]}{job_data.additional_info[1]}\
               {job_posting.industry}{job_posting.benefits}"
    result, score = predict_job_posting(string)
    print(f"result: {result}; score: {score}")
    return {"fradulent": int(result), "score": float(score)}, 200


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
