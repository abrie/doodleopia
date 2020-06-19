package vector

import (
	"io/ioutil"
	"os"
	"testing"
)

func TestPathFor(t *testing.T) {
	store := Store{Directory: "abc"}
	path := store.PathFor("file.ext")
	if path != "abc/file.ext" {
		t.Errorf("Want: %s; Got: %s", "abc/file.ext", path)
	}
}

func TestWrite(t *testing.T) {
	dir, err := ioutil.TempDir("", "vector-store-test")
	if err != nil {
		t.Fatal(err)
	}

	store := Store{Directory: dir}
	if err := store.WriteJSON("abc.def", "svg-string-here"); err != nil {
		t.Fatal(err)
	}

	file, err := os.Open(store.PathFor("abc.def"))
	if err != nil {
		t.Errorf("Failed to open file: %s", store.PathFor("abc.def"))
	}

	defer file.Close()

	b, err := ioutil.ReadAll(file)
	if string(b) != "svg-string-here" {
		t.Errorf("Want: %s; Got: %s", "svg-string-here", string(b))
	}

	defer os.RemoveAll(dir)
}

func TestIndex(t *testing.T) {
	dir, err := ioutil.TempDir("", "vector-store-test")
	if err != nil {
		t.Fatal(err)
	}

	store := Store{Directory: dir}
	want := []string{"a.svg", "b.svg", "c.svg"}

	for _, filename := range want {
		if err := store.WriteJSON(filename, "svg-string-here"); err != nil {
			t.Fatal(err)
		}
	}

	got, err := store.GetIndex()
	if err != nil {
		t.Fatal(err)
	}

	if len(got) != len(want) {
		t.Errorf("Expected %d files, got %d.", len(want), len(got))
	}

	defer os.RemoveAll(dir)
}
