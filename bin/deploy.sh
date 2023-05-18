#!/bin/bash

# use npm run build to build the project first
aws s3 sync dist s3://mint.onsui.gg \
    --cache-control "public, max-age=3600" \
    --content-language "en" \
    --metadata-directive "REPLACE"
