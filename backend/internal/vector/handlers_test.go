package vector

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/google/go-cmp/cmp"
)

type checkFunc func(rec *httptest.ResponseRecorder) error

func checkContentType(want string) checkFunc {
	return func(response *httptest.ResponseRecorder) error {
		if got := response.Header().Get("Content-type"); got != want {
			return fmt.Errorf("Got=`%s`; Want=`%s`", got, want)
		}
		return nil
	}
}

func checkStatus(wantCode int) checkFunc {
	return func(response *httptest.ResponseRecorder) error {
		if code := response.Code; code != wantCode {
			return fmt.Errorf("Got=%d; Want=%d", code, wantCode)
		}
		return nil
	}
}

func checkBody(wantBody string) checkFunc {
	return func(response *httptest.ResponseRecorder) error {
		bodyBytes, err := ioutil.ReadAll(response.Result().Body)
		if err != nil {
			return err
		}

		body := string(bodyBytes)
		if body != wantBody {
			return fmt.Errorf("Got=`%s`; Want=`%s`", body, wantBody)
		}

		return nil
	}
}

func checkPostResponse(wantBody PostResponse) checkFunc {
	return func(response *httptest.ResponseRecorder) error {
		bodyBytes, err := ioutil.ReadAll(response.Result().Body)
		if err != nil {
			return err
		}

		log.Println(string(bodyBytes))
		var body PostResponse
		err = json.Unmarshal(bodyBytes, &body)
		if err != nil {
			log.Println("Failed to unmarshal JSON")
			return err
		}

		if cmp.Equal(wantBody, body) != true {
			return fmt.Errorf("Body=%s; Want=%s", body, wantBody)
		}

		return nil
	}
}

func TestWriteError(t *testing.T) {
	store := &MockStore{
		MockWriteError: "this is an expected error",
	}

	rr := httptest.NewRecorder()

	request := PostRequest{Filename: "filename.ext", Svg: "<svg></svg>", Json: "{}"}
	bodyBytes, err := json.Marshal(request)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("POST", "/", bytes.NewBuffer(bodyBytes))
	if err != nil {
		t.Fatal(err)
	}

	handler := PostHandler(store)
	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusOK)(rr); err != nil {
		t.Error(err)
	}

	expected := PostResponse{Error: "this is an expected error"}
	if err := checkPostResponse(expected)(rr); err != nil {
		t.Error(err)
	}
}

func TestValidPost(t *testing.T) {
	store := &MockStore{}
	rr := httptest.NewRecorder()

	request := PostRequest{Filename: "filename.ext", Svg: "<svg></svg>", Json: "{}"}
	bodyBytes, err := json.Marshal(request)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("POST", "/", bytes.NewBuffer(bodyBytes))
	if err != nil {
		t.Fatal(err)
	}

	handler := PostHandler(store)
	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusOK)(rr); err != nil {
		t.Error(err)
	}

	expected := PostResponse{Result: "success"}
	if err := checkPostResponse(expected)(rr); err != nil {
		t.Error(err)
	}
}

func TestUnparsableRequest(t *testing.T) {
	store := &MockStore{}
	rr := httptest.NewRecorder()

	bodyBytes := []byte("this is not parseable as json")
	req, err := http.NewRequest("POST", "/", bytes.NewBuffer(bodyBytes))
	if err != nil {
		t.Fatal(err)
	}

	handler := PostHandler(store)
	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusBadRequest)(rr); err != nil {
		t.Error(err)
	}

	if err = checkBody(ErrorFailedToParse + "\n")(rr); err != nil {
		t.Error(err)
	}
}

func TestMissingRequestBody(t *testing.T) {
	store := &MockStore{}
	rr := httptest.NewRecorder()

	req, err := http.NewRequest("POST", "/", nil)
	if err != nil {
		t.Fatal(err)
	}

	handler := PostHandler(store)
	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusBadRequest)(rr); err != nil {
		t.Error(err)
	}

	if err = checkBody(ErrorMissingBody + "\n")(rr); err != nil {
		t.Error(err)
	}
}

func TestGetNotFound(t *testing.T) {
	dir, err := ioutil.TempDir("", "vector-store-test")
	if err != nil {
		t.Fatal(err)
	}

	store := Store{Directory: dir}

	rr := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/123.456", nil)
	if err != nil {
		t.Fatal(err)
	}

	handler := GetHandler(&store)
	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusNotFound)(rr); err != nil {
		t.Error(err)
	}

	defer os.RemoveAll(dir)
}

func TestGetPlaceholder(t *testing.T) {
	store := Store{Directory: ""}
	handler := GetHandler(&store)

	rr := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "placeholder.svg?width=130&height=202", nil)
	if err != nil {
		t.Fatal(err)
	}

	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusOK)(rr); err != nil {
		t.Error(err)
	}

	wantBody := `<svg viewBox="0 0 130 202" xmlns="http://www.w3.org/2000/svg"></svg>`
	if err := checkBody(wantBody)(rr); err != nil {
		t.Error(err)
	}

	if err := checkContentType("image/svg+xml")(rr); err != nil {
		t.Error(err)
	}
}

func TestGetPlaceholderNoQuery(t *testing.T) {
	store := Store{Directory: ""}
	handler := GetHandler(&store)

	rr := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "placeholder.svg", nil)
	if err != nil {
		t.Fatal(err)
	}

	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusBadRequest)(rr); err != nil {
		t.Error(err)
	}
}

func TestGetPlaceholderBadQuery(t *testing.T) {
	store := Store{Directory: ""}
	handler := GetHandler(&store)

	rr := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "placeholder.svg?width=abc&height=100", nil)
	if err != nil {
		t.Fatal(err)
	}

	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusBadRequest)(rr); err != nil {
		t.Error(err)
	}
}

func TestGetSVG(t *testing.T) {
	dir, err := ioutil.TempDir("", "vector-store-test")
	if err != nil {
		t.Fatal(err)
	}

	store := Store{Directory: dir}
	if err := store.WriteSVG("abc.def", "svg-string-here"); err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/abc.def", nil)
	if err != nil {
		t.Fatal(err)
	}

	handler := GetHandler(&store)
	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusOK)(rr); err != nil {
		t.Error(err)
	}

	if err := checkBody("svg-string-here")(rr); err != nil {
		t.Error(err)
	}
	defer os.RemoveAll(dir)
}

func TestGetJSON(t *testing.T) {
	dir, err := ioutil.TempDir("", "vector-store-test")
	if err != nil {
		t.Fatal(err)
	}

	store := Store{Directory: dir}
	if err := store.WriteJSON("abc.def.json", "json-string-here"); err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/abc.def.json", nil)
	if err != nil {
		t.Fatal(err)
	}

	handler := GetHandler(&store)
	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusOK)(rr); err != nil {
		t.Error(err)
	}

	if err := checkBody("json-string-here")(rr); err != nil {
		t.Error(err)
	}
	defer os.RemoveAll(dir)
}

func TestSvgFilenameConversion(t *testing.T) {
	want := "filename.svg"
	got := svgFilename("../../filename.svg")

	if want != got {
		t.Error(fmt.Errorf("Got=`%s`; Want=`%s`", got, want))
	}
}

func TestJsonFilenameConversion(t *testing.T) {
	want := "filename.json"
	got := svgFilename("../../filename.json")

	if want != got {
		t.Error(fmt.Errorf("Got=`%s`; Want=`%s`", got, want))
	}
}
