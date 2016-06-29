#!/usr/bin/env bash

clear

cd ./test

now="$(date +'%Y-%m-%d-%H-%M-%S')"
reportsFolder=./reports
reportName=auto-test-$now

mocha test-unit --reporter mochawesome --reporter-options reportDir=$reportsFolder,reportName=$reportName,reportTitle="Auto Test $now",inlineAssets=false

unamestr=`uname`
reportPath="$reportsFolder/$reportName.html"
if [[ "$unamestr" == 'Darwin' ]]; then # detect mac os
   open $reportPath
elif [[ "$unamestr" == 'Linux' ]]; then # detect linux #FIXME: TODO: add needed string instead of 'Linux'
   xdg-open $reportPath
fi
