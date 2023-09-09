FROM python:3.9
USER root

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get -y install locales vim less libgl1-mesa-dev && \
    localedef -f UTF-8 -i ja_JP ja_JP.UTF-8
ENV LANG ja_JP.UTF-8
ENV LANGUAGE ja_JP:ja
ENV LC_ALL ja_JP.UTF-8
ENV TZ JST-9
ENV TERM xterm
ENV PORT 5000

EXPOSE 5000

RUN useradd -m -u 1000 prod
USER prod
ENV HOME=/home/prod \
	PATH=/home/prod/.local/bin:$PATH

WORKDIR $HOME/app

COPY ./requirements.txt $HOME/app/requirements.txt

RUN pip install --upgrade pip
RUN pip install --upgrade setuptools
RUN pip install --no-cache-dir --upgrade -r $HOME/app/requirements.txt

COPY . $HOME/app

USER root
RUN python scripts/create_models.py

USER prod

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
