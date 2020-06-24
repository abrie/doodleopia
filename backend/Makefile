PID=.hot-compile.pid
PWD=$(shell pwd)
BIN_DIR=$(PWD)/bin
SRC_DIR=$(PWD)/src
BIN_NAME=service
FLATBUFFERS_SRC=$(PWD)/../flatbuffers
DATA_DIR?=$(PWD)/data

all: build

initialize-dependencies:
	-@go mod init
	-@go mod vendor

update-dependencies:
	cd $(SRC_DIR) && go get -u ./...

generate:
	@rm -rf message
	@flatc --go -o $(PWD)/src/internal $(FLATBUFFERS_SRC)/message.fbs

build: generate
	cd $(SRC_DIR) && go build -v -o $(BIN_DIR)/$(BIN_NAME) backend/cmd/system

container:
	docker image build -t goeieware.ca/doodleopia:latest .
	docker push goeieware.ca/doodleopia:latest

test:
	cd $(SRC_DIR) && go test -coverprofile=coverage.out ./...

test-coverage:
	-cd $(SRC_DIR) && @go tool cover -html=coverage.out

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
