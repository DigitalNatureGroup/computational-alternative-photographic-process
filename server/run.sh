#!/bin/zsh

project=computational-alternative-process-server
images=$(docker image ls | grep computational-alternative-process-server)

[[ -z images ]] && docker build . -t $project
docker run -d $project python app.py
