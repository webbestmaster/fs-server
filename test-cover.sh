#!/usr/bin/env bash

reportsFolder=reports-cover

clear

cd ./test

./../node_modules/.bin/istanbul cover --root ./../ --dir $reportsFolder _mocha test-unit

unamestr=`uname`
reportPath="$reportsFolder/lcov-report/index.html"
if [[ "$unamestr" == 'Darwin' ]]; then # detect MacOS
   open $reportPath
elif [[ "$unamestr" == 'Linux' ]]; then # detect Linux
   xdg-open $reportPath
fi
