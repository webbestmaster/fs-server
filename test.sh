#!/usr/bin/env bash

clear

cd ./test

now="$(date +'%Y-%m-%d-%H-%M-%S')"
echo $now

mocha test --reporter mochawesome --reporter-options reportDir=./reports,reportName=auto-test-$now,reportTitle="Auto Test $now",inlineAssets=false
