from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from bs4 import BeautifulSoup, Comment
from lxml import etree
import minify_html
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List
import enum


class EmploymentType(str, enum.Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    TEMPORARY = "Temporary"
    OTHER = "Other"


class ExtractJobPosting(BaseModel):
    job_title: str
    location_city: str
    location_state: str
    location_country: str
    salary_range: str
    job_description: str
    job_requirements: str
    company_name: str
    telecommuting: bool
    employment_type: EmploymentType
    industry: str
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


def extract_job_posting(html_str: str) -> ExtractJobPosting:
    try:
        completion = client.beta.chat.completions.parse(
            model="deepseek-r1:7b",
            messages=[
                {"role": "system", "content": "Extract job posting"},
                {
                    "role": "user",
                    "content": html_str,
                }
            ],
            response_format=ExtractJobPosting,
        )

        response = completion.choices[0].message
        if response.parsed:
            return response.parsed
        elif response.refusal:
            print(response.refusal)
    except Exception as e:
        print(f"Error in extracting job posting: {e}")
        return None


@app.post("/getResponse")
async def get_response(request: Request):
    data = await request.json()
    html = data.get("jobData")
    cleaned_html = clean_html(html)

    minified = minify_html.minify(str(cleaned_html))
    print(extract_job_posting(minified).model_dump_json())

    return {"message": "Data received successfully", "data": data}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
