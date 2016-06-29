#!/usr/bin/env bash

clear

cd ./test

now="$(date +'%Y-%m-%d-%H-%M-%S')"
reportsFolder=./reports
reportName=auto-test-$now

mocha test-unit --reporter mochawesome --reporter-options reportDir=$reportsFolder,reportName=$reportName,reportTitle="Auto Test $now",inlineAssets=false

unamestr=`uname`
if [[ "$unamestr" == 'Darwin' ]]; then # detect mac os
   open "$reportsFolder/$reportName.html"
elif [[ "$unamestr" == 'Linux' ]]; then # detect linux #FIXME: TODO: add needed string instead of 'Linux'
   xdg-open "$reportsFolder/$reportName.html"
fi
