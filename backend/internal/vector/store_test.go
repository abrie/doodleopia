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
	if err := store.WriteSVG("abc.def", "svg-string-here"); err != nil {
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
