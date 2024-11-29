#!/bin/bash

build_dir=lib/*

for file in $build_dir; do
  if [[ -f "$file" ]]; then
    # Read the first character of the file
    first_char=$(head -c 1 "$file")

    echo $first_char
    if [[ -z "$first_char" || "$first_char" == $'\n' ]]; then
      echo "Deleting empty file: $file"
      rm "$file"
    fi
  fi
done