FROM continuumio/miniconda3

WORKDIR /ORV

COPY environment.yml .

RUN conda env create -f environment.yml

COPY . .

EXPOSE 3002

ENV PYTHONPATH=/ORV

CMD ["conda", "run", "-n", "LoparGO", "uvicorn", "scripts.server:app", "--host", "0.0.0.0", "--port","3002"]
