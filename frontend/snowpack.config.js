{
  "scripts": {
    "mount:public": "mount public --to /",
    "mount:src": "mount src --to /_dist_",
    "bundle:*": "@snowpack/plugin-webpack",
    "build:js,jsx": "@snowpack/plugin-babel"
  },
  "plugins": ["@snowpack/plugin-webpack", "@snowpack/plugin-babel"]
}
