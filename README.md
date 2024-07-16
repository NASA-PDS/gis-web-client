# PDS Template Repository for Node.js

This is the template repository for PDS's Node.js projects. The goal of this repository is to be a base of Node.js repositories developed by the Planetary Data System.
4
**👉 Note:** Please replace this entire `README.md` with text appropriate for your package!

**👉 Also note:** Check _every_ other file and replace text appropriate for your package!

This `README.md` documents the _template repository_ and contains instructions on how to use it after you've duplicated the template into a new project-specific repository. How do you do that? Simply click the <kbd>Use this template</kbd> button ↑ (or use [this hyperlink](https://github.com/NASA-PDS/template-repo-nodejs/generate)) and you've got a new repository already kitted-out with this template.


## 🏃 Getting Started With This Template

Our [wiki on Git and GitHub](https://github.com/NASA-PDS/nasa-pds.github.io/wiki/Git-and-Github-Guide#creating-a-new-repo) has lots of useful information on setting up a new repository using the PDS Engineering Node templates.

**👉 Important!** You must assign the teams as mentioned on the wiki page above! At a minimum, these are:

| Team                                | Permission |
| ----------------------------------- | ---------- |
| `@NASA-PDS/pds-software-committers` | `write`    |
| `@NASA-PDS/pds-software-pmc`        | `admin`    |
| `@NASA-PDS/pds-operations`          | `admin`    |

This template was populated with [Vite](https://vitejs.dev) with [React](https://react.dev). If neither of these apply to your Node.js project, feel free to edit those out.

We recommend the use of [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm), since different projects within the Planetary Data System require different versions of Node.js. This tool allows you to use a specific version of Node.js for each terminal session on your machine. ***If you haven't already, [install or update nvm](https://github.com/nvm-sh/nvm#installing-and-updating).***

Once your `nvm` installation has been [verified](https://github.com/nvm-sh/nvm/blob/master/README.md#verify-installation), configured, and activated (see the [NVM README](https://github.com/nvm-sh/nvm#readme)), you can run the following commands

    nvm install 12.22.11
    nvm use 12.22.11

This configures your `PATH` in your current terminal session so `node --version` prints `v12.22.11`. There are convenient shortcuts for LTS versions; again see the [NVM README](https://github.com/nvm-sh/nvm#readme).

By default, this template includes a `.nvmrc` file that contains `lts/*`, meaning "use the latest long-term support release". Feel free to adjust this as needed. To activate Node.js using the `.nvmrc` file, in a terminal window, navigate to where you have cloned this repository and execute the following command, paying close attention to any additional instructions it may provide:

    nvm use

**👉 Note:** If you're on Windows, [please see these important notes](https://github.com/nvm-sh/nvm#important-notes).


---

# 📽️ My Project

This is the XYZ that does this, that, and the other thing for the Planetary Data System.

Please visit our website at: https://nasa-pds.github.io/pds-my-project

It has useful information for developers and end-users.


## 💽 Prerequisites

Here, mention any system-wide requirements (`brew install`, `apt-get install`, `yum install`, …) needed to work with this ppackage.


## 🏎️ User Quickstart

(Here, give a guide to end-users how to quickly get up to speed with your package.)

You can quickly install this by typing

    npm install

(If possible, make it so that your program works out of the box without any additional configuration.)


To execute, run:

    (put your run commands here)


## ✋ Code of Conduct

All users and developers of the NASA-PDS software are expected to abide by our [Code of Conduct](https://github.com/NASA-PDS/.github/blob/main/CODE_OF_CONDUCT.md). Please read this to ensure you understand the expectations of our community.


## 🔧 Development

To develop this project, use your favorite text editor, or an integrated development environment of your choice with Node.js support.


### 👏 Contributing

For information on how to contribute to NASA-PDS codebases please take a look at our [Contributing guidelines](https://github.com/NASA-PDS/.github/blob/main/CONTRIBUTING.md).


### 🤫 Detecting Secrets

(These instructions can probably stay as-is.)

The PDS Engineering Node recommends using [detect-secrets](https://github.com/NASA-PDS/nasa-pds.github.io/wiki/Git-and-Github-Guide#detect-secrets) in order to prevent credentials, private email addresses, application keys, etc., from leaking into the commit history. To use `detect-secrets`, install the tool according to the instructions in the wiki. Then, make a baseline for any secrets that are _supposed_ to be in repository:

    detect-secrets scan . \
        --all-files \
        --disable-plugin AbsolutePathDetectorExperimental \
        --exclude-files '\.secrets..*' \
        --exclude-files '\.git.*' \
        --exclude-files '\.pre-commit-config\.yaml' \
        --exclude-files 'node_modules' > .secrets.baseline

Review the `.secrets.baseline` to determine which should be allowed and which are false positives:

    detect-secrets audit .secrets.baseline

Please remove any secrets that should not be seen by the public. You can then add the baseline file to the commit:

    git add .secrets.baseline

Then, configure the `pre-commit` hooks:

    pre-commit install
    pre-commit install -t pre-push
    pre-commit install -t prepare-commit-msg
    pre-commit install -t commit-msg

These hooks then will check for any future commits that might contain secrets.

👉 **Note:** A one time setup is required both to support `detect-secrets` and in your global Git configuration. See [the wiki entry on Secrets](https://github.com/NASA-PDS/nasa-pds.github.io/wiki/Git-and-Github-Guide#detect-secrets) to learn how.


### 📦 Packaging

Enter: `npm run build`.


### 🩺 Tests

Use `npm run tests`.


## 📢 Publication

The continuous integration provided by the [Roundup Action](https://github.com/NASA-PDS/roundup-action/) takes care of this. But you can manually publish a release with `npm publish`.
