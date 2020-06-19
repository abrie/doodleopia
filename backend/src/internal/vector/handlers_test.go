package vector

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
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
		var body PostResponse
		if err := json.NewDecoder(response.Result().Body).Decode(&body); err != nil {
			return fmt.Errorf("Failed to unmarshal JSON: %v", err)
		}

		if cmp.Equal(wantBody, body) != true {
			return fmt.Errorf("Body=%v; Want=%v", body, wantBody)
		}

		return nil
	}
}

func TestWriteError(t *testing.T) {
	store := &MockStore{
		MockWriteError: "this is an expected error",
	}

	rr := httptest.NewRecorder()

	request := PostRequest{
		CommandStore: &CommandStore{
			Filename: "filename.ext",
			Content:  "{}"}}

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

	expected := PostResponse{
		ResultStore: &ResultStore{
			Error: "this is an expected error"}}

	if err := checkPostResponse(expected)(rr); err != nil {
		t.Error(err)
	}
}

func TestPostCommandStore(t *testing.T) {
	store := &MockStore{}
	rr := httptest.NewRecorder()

	request := PostRequest{CommandStore: &CommandStore{
		Filename: "filename.ext", Content: "{}"}}

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

	expected := PostResponse{ResultStore: &ResultStore{Error: ""}}
	if err := checkPostResponse(expected)(rr); err != nil {
		t.Error(err)
	}
}

func TestPostCommandIndex(t *testing.T) {
	want := []string{"file1.svg", "file2.svg", "file3.svg"}

	store := &MockStore{
		MockIndexResult: want,
	}

	cmd := PostRequest{CommandIndex: &CommandIndex{}}

	cmdBytes, err := json.Marshal(cmd)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("POST", "/", bytes.NewBuffer(cmdBytes))
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	handler := PostHandler(store)

	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusOK)(rr); err != nil {
		t.Error(err)
	}

	if err := checkContentType("application/json")(rr); err != nil {
		t.Error(err)
	}

	expected := PostResponse{ResultIndex: &ResultIndex{Filenames: want}}
	if err := checkPostResponse(expected)(rr); err != nil {
		t.Error(err)
	}
}

func TestPostCommandIndexError(t *testing.T) {
	want := "this is an expected store index error."
	store := &MockStore{
		MockIndexError: want,
	}

	cmd := PostRequest{CommandIndex: &CommandIndex{}}

	cmdBytes, err := json.Marshal(cmd)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("POST", "/", bytes.NewBuffer(cmdBytes))
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	handler := PostHandler(store)

	handler.ServeHTTP(rr, req)

	if err := checkStatus(http.StatusOK)(rr); err != nil {
		t.Error(err)
	}

	if err := checkContentType("application/json")(rr); err != nil {
		t.Error(err)
	}

	expected := PostResponse{ResultIndex: &ResultIndex{Error: want}}
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

	wantBody := `<svg viewBox="0,0,130,202" xmlns="http://www.w3.org/2000/svg"></svg>`
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
	if err := store.WriteJSON("abc.def", "svg-string-here"); err != nil {
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
