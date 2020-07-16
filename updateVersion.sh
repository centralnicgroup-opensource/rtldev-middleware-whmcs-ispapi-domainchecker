#!/bin/bash

# THIS SCRIPT UPDATES THE HARDCODED VERSION
# IT WILL BE EXECUTED IN STEP "prepare" OF
# semantic-release. SEE package.json

# version format: X.Y.Z
newversion="$1"
date="$(date +'%Y-%m-%d')"

printf -v sed_script 's/"version" => "[0-9]\+\.[0-9]\+\.[0-9]\+"/"version" => "%s"/g' "${newversion}"
sed -i -e "${sed_script}" modules/addons/ispapidomaincheck/ispapidomaincheck.php

printf -v sed_script 's/"version": "[0-9]\+\.[0-9]\+\.[0-9]\+"/"version": "%s"/g' "${newversion}"
sed -i -e "${sed_script}" release.json

printf -v sed_script 's/"date": "[0-9]\+-[0-9]\+-[0-9]\+"/"date": "%s"/g' "${date}"
sed -i -e "${sed_script}" release.json
