FROM jrottenberg/ffmpeg:4.0-scratch AS ffmpeg
FROM node:10-alpine

LABEL maintainer="Yesterday17"

COPY --from=ffmpeg / /

RUN mkdir -p /home/HibikiDownloadBot
WORKDIR /home/HibikiDownloadBot

COPY . /home/HibikiDownloadBot

RUN npm install -g -s --no-progress yarn
RUN yarn

CMD [ "yarn", "start" ]