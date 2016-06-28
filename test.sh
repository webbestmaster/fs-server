#!/usr/bin/env bash

clear

cd ./test

now="$(date +'%Y-%m-%d-%H-%M-%S')"
reportsFolder=./reports
reportName=auto-test-$now

mocha test --reporter mochawesome --reporter-options reportDir=$reportsFolder,reportName=$reportName,reportTitle="Auto Test $now",inlineAssets=false

open "$reportsFolder/$reportName.html"

