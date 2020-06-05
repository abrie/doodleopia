PID=.hot-compile.pid
PWD=$(shell pwd)
GOPATH=$(PWD)
BIN_DIR=$(PWD)/bin
SRC_DIR=$(PWD)
BIN_NAME=service
DATA_DIR?=data
CONTAINER_NAME=image

all: build

initialize-dependencies:
	-@go mod init
	-@go mod vendor

update-dependencies:
	go get -u ./...

build:
	go build -v -o $(BIN_DIR)/$(BIN_NAME) backend/cmd/system

test:
	go test -coverprofile=coverage.out ./...

test-coverage:
	-@go tool cover -html=coverage.out

watch-test: test
	@fswatch -l 0.5 -o $(SRC_DIR) -e ".*" -i "\\.go$$" | xargs -n1 -I{} make test

start: kill build
	@$(BIN_DIR)/$(BIN_NAME) -d $(DATA_DIR) & echo $$! > $(PID)

restart: notify start

notify:
	@echo Recompiling and reloading...

kill:
	-@kill `cat $(PID) 2>/dev/null` 2>/dev/null || true
	-@rm $(PID) || true

watch: restart
	@fswatch -l 0.5 -o $(SRC_DIR) -e ".*" -i "\\.go$$" | xargs -n1 -I{}  make restart

.PHONY: clean
clean:
	-rm $(BIN_DIR)/$(BIN_NAME)
