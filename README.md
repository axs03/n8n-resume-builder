
# n8n Resume Builder

## Overview
This project is a resume builder platform that leverages a simple n8n workflow and a Next.js frontend to generate, review, and optimize resumes for job applications. It supports LaTeX editing, PDF preview, and workflow automation for resume customization.
This is just a test project to see how n8n, a no code tool (kind of), really worked and how I could use it to automate some stuff. 

### Key Features
- Next.js frontend for resume selection, editing, and preview
- LaTeX resume templates stored in `Resume/Base`
- n8n workflow for draft, preview, and save operations
- API endpoints for resume optimization, preview, and saving
- PDF generation and access for each application
- Dockerized setup

## Project Structure
- `frontend-next/`: Next.js frontend app
- `Resume/`: LaTeX resume templates and generated resumes. You will need to create this folder
- `workflows/`: n8n workflow JSON
- `data/`: Storage and config
- `Dockerfile`, `docker-compose.yml`: Container setup

## API Endpoints

- `/api/resume-optimize`: Optimize resume for job description
- `/api/resume-preview`: Compile and preview LaTeX resume
- `/api/resume-save`: Save final resume
- `/resumes/`: List base resumes
- `/applications/`: Access generated PDFs

## Usage
0. Download your resume in the `.tex` format and palce it in the `Resume/Base` folder.
1. Select a base resume from the dropdown (populated from `Resume/Base`)
2. Enter job description, job title, and company
3. Generate and review the draft resume
4. Edit LaTeX as needed in-browser
5. Preview PDF and approve final output
6. Save and access generated PDFs for each application

## Setup
1. Clone this repository
2. Make sure you have docker installed and ample space in Docker
3. Get some of you Resume's which have been written in LaTex and place them in the `Resume/Base` folder. You can have as many as you want, just make sure they are a different name, and have the extension `.tex`
4. Startup your docker containers using the following command
    ``` bash
    cd n8n-resume-builder
    docker compose up --build -d
    ```
    This will download all the containers and mount all the needed volumes

5. Once the containers have started, access the n8n UI and the frontend:

    Frontend: [http://localhost:8080](http://localhost:8080) \
    n8n: [http://localhost:5678](http://localhost:5678)

    But before we can use the frontend, we need to setup the n8n workflow.

6. Grab the workflow from the `/workflow` directory and import it into n8n. (Create Workflow)
7. Once imported, make sure the workflow is active by Publishing the workflow. You can publish a workflow by navigating to the top right and click the button to publish
8. Next, go to the main menu and create a credential for your OpenAI API key, this will enable the workflow to make a request
9. Go back into the workflow and go to the AI nodes, and set the credential in by clicking on the node and confirming it
10. Publish the updated workflow
11. You can now proceed to using the frontend

## Workflow Integration

Import the workflow from `workflows/Resume Form Workflow.json` into n8n and activate it. The frontend interacts with n8n via the API endpoints listed above.

## Running the Project

Start the project using Docker Compose:

```bash
docker compose up -d
```


## Notes

- Resume dropdown values are filenames from `Resume/Base`
- Preview PDF is served from `/applications/<company>/<jt>/preview_resume.pdf`
- Final PDF is served from `/applications/<company>/<jt>/Sahu_Aman_Resume.pdf`
- There a lot of improvements to be made, will come in the future.