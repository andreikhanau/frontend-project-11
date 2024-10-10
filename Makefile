web:
	npx webpack serve

install:
	npm ci

test:
	npm test

lint:
	npx eslint .

.PHONY: test