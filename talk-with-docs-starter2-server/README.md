# FastAPI Server for Processing AI Requests

## 🧪 Set up Poetry

Poetry is a Python management framework for building projects and systems. This was chosen to help with dependency management and project construction.

### Initialize the project

```bash
poetry init
```

Or if you want to go in one go:

```bash
poetry init --name "fastapi-server" --dependency fastapi --dependency uvicorn
```

### Add dependencies

```bash
poetry add fastapi uvicorn boto3
```

### Run the server

Ensure that the virtual environment is added in the project repo (vs. being added to the user):

```bash
poetry config virtualenvs.in-project true
```

Create the environment:

```bash
poetry env activate
```

Activate the virtual environment:

```bash
source .venv/bin/activate
```

Install the packages listed in the `pyproject.toml` file:

```bash
poetry install
```

Start the server:

```bash
./run.sh
```

or use the full script:

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
