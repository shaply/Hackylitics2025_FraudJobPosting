from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from bs4 import BeautifulSoup, Comment
from lxml import etree
import minify_html
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional
import enum


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


client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clean_html(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")

    # Remove comments
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()

    # Remove attributes like aria-*, class, id, style, data-*
    for tag in soup.find_all(True):
        attrs = list(tag.attrs.keys())
        for attr in attrs:
            if attr.startswith("aria-") or attr in ["class", "id", "style"] or attr.startswith("data-"):
                del tag[attr]

    # Remove links but keep the text
    for a in soup.find_all("a"):
        a.decompose()

    # Remove images
    for img in soup.find_all("img"):
        img.decompose()

    # Remove SVG elements
    for svg in soup.find_all("svg"):
        svg.decompose()

    # Collapse unnecessary tags
    for tag in soup.find_all():
        if tag.name in ["div", "span", "section", "article"] and not tag.attrs and not tag.contents:
            tag.decompose()

    return soup


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
                }
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
    print(job_data)
    print(job_posting)
    return {"message": "Data received successfully", "title": job_data.title}, 200

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
