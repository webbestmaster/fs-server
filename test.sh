#!/usr/bin/env bash

clear

cd ./test

now="$(date +'%Y-%m-%d-%H-%M-%S')"
reportsFolder=./reports
reportName=auto-test-$now

mocha test --reporter mochawesome --reporter-options reportDir=$reportsFolder,reportName=$reportName,reportTitle="Auto Test $now",inlineAssets=false

# use open "$reportsFolder/$reportName.html" - mac os
# use xdg-open "$reportsFolder/$reportName.html" - like-debian

xdg-open "$reportsFolder/$reportName.html"

