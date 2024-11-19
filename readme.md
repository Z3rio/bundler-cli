# Bundler CLI

## PLEASE NOTE THIS REPO IS BEING MOVED [HERE](https://github.com/Z3rio/fivem-resource-cli)

This is a cli created to execute tasks, then bundle your files into a zip file.

I created this to make the process of uploading my FiveM resources faster. Since
I would have to build and manually select which files should be included in the
zip previously.

## Installation

Run the following command: `npm install -g @zerio2/bundler-cli`

## Usage

Create a `bundler.config.js` file in your directory, example structure:

```js
module.exports = {
  name: "zerio-radio",
  tasks: ["cd ./src && npm run build"],
  ignore: [
    ".git",
    ".github",
    "src",
    ".gitignore",
    ".gitattributes",
    "bundle.ps1",
  ],
};
```

`tasks` & `ignore` is not needed, only the `name` parameter is required.

Then run `zBundler` to bundle the files into a zip file.
