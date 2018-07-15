# Node Get Financial Stats 🌏📈

## It gets the financial data of a predefined list of financial instruments scraping the Google Finance website. Then combines the gathered data into an easily readable HTLM page.

![Node GFS](assets/logo.png?raw=true "Node GFS")

### What does it do?
It automatically scrapes the Google Finance website to capture different screenshots and data of a user-defined list of financial instruments.

Then combines those information to create an easy digestible HTML file which at an easy grasp sums up all the data.

It also marks the tickers with the colours and labels set in a strategy function evaluating the P/E ratio. 💸

As a **bonus** it will output a fine selection of Emoji in the terminal log.

### Usage:
- Copy `config-template.js` to a new file called `config.js`;
- Edit the file `config.js` to match your preferences;
- Install dependencies: `npm i`;
- Run the program: `node program.js`;
    - It will create a new sub-directory with all the assets;
    - It will create the HTML page in the current directory;
- Open the just created HTML page to consult your precious data. 🙌

### About:
[About the author.](https://frarizzi.science/about)

### Requirements:
 - NodeJS 🦏
 - NPM 📦

### Terminal expected output for \[`APPL`, `GOOG`, `JNJ`\]:
![Terminal Output](assets/terminal-output.png?raw=true "Terminal Output")
