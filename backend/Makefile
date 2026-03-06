SHELL := /bin/bash
REQUIRED_PYTHON_MINOR := 11

.PHONY: run setup check-python

check-python:
	@python3 -c "import sys; exit(0 if sys.version_info >= (3, $(REQUIRED_PYTHON_MINOR)) else 1)" 2>/dev/null \
		|| (echo "Error: Python 3.$(REQUIRED_PYTHON_MINOR)+ is required. You have $$(python3 --version)." \
			&& echo "Install it with: pyenv install 3.11.9 && pyenv local 3.11.9" && exit 1)

setup: check-python
	python3 -m venv venv
	source venv/bin/activate && pip install -r requirements.txt
	@echo "Setup complete. Run 'make run' to start the server."

run:
	set -a && source venv/bin/activate && [ -f .env ] && source .env; set +a && python -m uvicorn main:app --reload
