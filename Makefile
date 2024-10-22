web:
	npx webpack serve

install:
	npm ci

test:
	npm test

lint:
	npx eslint .

build:
	NODE_ENV=production npx webpack

.PHONY: test