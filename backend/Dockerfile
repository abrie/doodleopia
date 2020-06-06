FROM golang:1.14-alpine AS build

WORKDIR /src/
COPY src/ .

RUN CGO_ENABLED=0 go build -o /bin/service backend/cmd/system

FROM scratch
COPY --from=build /bin/service /bin/service
ENTRYPOINT ["/bin/service", "-d", "/data"]
