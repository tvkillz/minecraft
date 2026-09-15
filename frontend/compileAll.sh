#!/bin/bash

for p in voidborn iyashikei helix final_whistle wildreach; do
  echo "Compiling $p"
  PROJECT=$p npm run compile
  echo "Building $p"
  PROJECT=$p npm run build
done