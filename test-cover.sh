#!/usr/bin/env bash

clear

cd ./test

./../node_modules/.bin/istanbul cover _mocha test-unit
